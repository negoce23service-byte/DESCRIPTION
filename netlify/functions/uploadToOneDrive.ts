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
const ROOT_FOLDER = process.env.ONEDRIVE_ROOT_FOLDER;

// Function to create a folder inside the specified ROOT_FOLDER
const createFolder = async (folderName: string): Promise<DriveItem> => {
  // We construct the URL to create the new folder inside the designated root folder.
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
    // Provide a specific error message if the root folder itself doesn't exist.
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
  
  // Add a check to ensure the root folder is configured. This is now mandatory.
  if (!ROOT_FOLDER) {
    console.error('FATAL: OneDrive root folder (ONEDRIVE_ROOT_FOLDER) is not configured in Netlify environment variables.');
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server configuration error: The OneDrive root folder is not specified. Please set ONEDRIVE_ROOT_FOLDER in your environment variables.' }),
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

    // Create the parent folder for the submission inside the specified ROOT_FOLDER
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
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return {
      statusCode: 500,
      body: JSON.stringify({ message: errorMessage }),
    };
  }
};
