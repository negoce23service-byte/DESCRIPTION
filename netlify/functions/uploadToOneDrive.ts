import { Buffer } from 'buffer';

// Define types for the data we expect to receive from the client
interface FilePayload {
  name: string;
  type: string;
  data: string; // base64 encoded file data
}

interface RequestBody {
  folderName: string;
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

// Function to create a folder in the root of OneDrive
const createFolder = async (folderName: string): Promise<DriveItem> => {
  const response = await fetch(`${API_URL}/me/drive/root/children`, {
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
    throw new Error(`Failed to create OneDrive folder: ${error.error?.message || response.statusText}`);
  }

  return response.json();
};

// Function to upload a single file to a specific folder
const uploadFile = async (file: FilePayload, folderName: string): Promise<DriveItem> => {
  const endpoint = `${API_URL}/me/drive/root:/${encodeURIComponent(folderName)}/${encodeURIComponent(file.name)}:/content`;
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
export const handler = async (event: { httpMethod: string; body: string }) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  if (!ACCESS_TOKEN) {
    console.error('FATAL: OneDrive Access Token is not configured in Netlify environment variables.');
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server configuration error: The application is not connected to OneDrive.' }),
    };
  }

  try {
    const { folderName, files } = JSON.parse(event.body || '{}') as RequestBody;

    if (!folderName || !files || !Array.isArray(files) || files.length === 0) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Missing folder name or files.' }) };
    }

    const sanitizedFolderName = folderName.replace(/[\\/:*?"<>|#%]/g, '-').trim();
    if (!sanitizedFolderName) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Invalid folder name provided.' }) };
    }

    // Create the parent folder for the submission
    const folder = await createFolder(sanitizedFolderName);
    if (!folder || !folder.webUrl) {
      throw new Error('Could not create or retrieve the OneDrive folder.');
    }

    // Upload all files in parallel to the newly created folder
    await Promise.all(files.map(file => uploadFile(file, sanitizedFolderName)));

    // Return the URL of the created folder on success
    return {
      statusCode: 200,
      body: JSON.stringify({ oneDriveFolderUrl: folder.webUrl }),
    };

  } catch (error) {
    console.error('Error during OneDrive upload process:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message || 'An unknown server error occurred.' }),
    };
  }
};
