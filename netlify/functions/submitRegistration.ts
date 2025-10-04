import { Buffer } from 'buffer';
import { getStore } from '@netlify/blobs';
import type { Handler } from "@netlify/functions";
import type { Registration } from '../../types';

// Define types for the data we expect to receive from the client
interface FilePayload {
  name: string;
  type: string;
  data: string; // base64 encoded file data
}

interface RequestBody extends Omit<Registration, 'id' | 'status' | 'submissionDate' | 'attachments' | 'oneDriveFolderUrl' | 'attachmentNames'> {
  files: FilePayload[];
}

// Define a type for the response from Microsoft Graph API
interface DriveItem {
  id: string;
  name: string;
  webUrl: string;
}

const API_URL = 'https://graph.microsoft.com/v1.0';
const ACCESS_TOKEN = process.env.ONEDRIVE_ACCESS_TOKEN;
const ROOT_FOLDER = process.env.ONEDRIVE_ROOT_FOLDER;

// Function to create a folder inside the specified ROOT_FOLDER
const createFolder = async (folderName: string): Promise<DriveItem> => {
  const createFolderUrl = `${API_URL}/me/drive/root:/${encodeURIComponent(ROOT_FOLDER!)}:/children`;

  const response = await fetch(createFolderUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      folder: {},
      '@microsoft.graph.conflictBehavior': 'rename',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Failed to create OneDrive folder:', error);
    if (error.error?.code === 'itemNotFound') {
        throw new Error(`Failed to create submission folder. The specified root folder "${ROOT_FOLDER}" was not found in OneDrive. Please create it first.`);
    }
    throw new Error(`Failed to create OneDrive folder: ${error.error?.message || response.statusText}`);
  }

  return response.json();
};

// Function to upload a single file to a specific path inside the ROOT_FOLDER
const uploadFile = async (file: FilePayload, folderName: string): Promise<DriveItem> => {
  const endpoint = `${API_URL}/me/drive/root:/${encodeURIComponent(ROOT_FOLDER!)}/${encodeURIComponent(folderName)}/${encodeURIComponent(file.name)}:/content`;
  const fileBuffer = Buffer.from(file.data, 'base64');

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': file.type,
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Failed to upload file to OneDrive:', error);
    throw new Error(`Failed to upload file "${file.name}": ${error.error?.message || response.statusText}`);
  }

  return response.json();
};

// Main Netlify Function handler
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  if (!ACCESS_TOKEN) {
    console.error('FATAL: OneDrive Access Token is not configured.');
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server configuration error: The application is not connected to OneDrive.' }),
    };
  }
  
  if (!ROOT_FOLDER) {
    console.error('FATAL: OneDrive root folder is not configured.');
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server configuration error: The OneDrive root folder is not specified.' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}') as RequestBody;
    const { fullName, email, nationalId, phone, category, files } = body;

    if (!fullName || !files || !Array.isArray(files) || files.length === 0) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Missing full name or files.' }) };
    }

    const sanitizedFolderName = fullName.replace(/[\\/:*?"<>|#%]/g, '-').trim();
    if (!sanitizedFolderName) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Invalid full name provided.' }) };
    }
    
    // --- Step 1: Upload files to OneDrive ---
    const folder = await createFolder(sanitizedFolderName);
    if (!folder || !folder.webUrl) {
      throw new Error('Could not create or retrieve the OneDrive folder.');
    }
    await Promise.all(files.map(file => uploadFile(file, sanitizedFolderName)));


    // --- Step 2: Save registration data to Netlify Blobs ---
    const newRegistration: Registration = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        submissionDate: new Date().toISOString(),
        fullName,
        email,
        nationalId,
        phone,
        category,
        attachmentNames: files.map(f => f.name),
        oneDriveFolderUrl: folder.webUrl,
    };
    
    const store = getStore('registrations');
    await store.set(newRegistration.id, JSON.stringify(newRegistration));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Registration successful!", oneDriveFolderUrl: folder.webUrl }),
    };

  } catch (error) {
    console.error('Error during submission process:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return {
      statusCode: 500,
      body: JSON.stringify({ message: errorMessage }),
    };
  }
};
