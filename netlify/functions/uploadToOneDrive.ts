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
const ROOT_FOLDER = process.env.ONEDRIVE_ROOT_FOLDER;

/**
 * Retrieves a fresh Microsoft Graph API access token using a refresh token.
 * This function is essential for long-term, unattended access without manual token renewal.
 * It requires specific environment variables to be set in your Netlify project.
 * @returns {Promise<string>} A new, valid access token.
 */
const getAccessToken = async (): Promise<string> => {
    const {
        ONEDRIVE_TENANT_ID,
        ONEDRIVE_CLIENT_ID,
        ONEDRIVE_CLIENT_SECRET,
        ONEDRIVE_REFRESH_TOKEN,
    } = process.env;

    // Validate that all required environment variables for token refresh are present.
    if (!ONEDRIVE_TENANT_ID || !ONEDRIVE_CLIENT_ID || !ONEDRIVE_CLIENT_SECRET || !ONEDRIVE_REFRESH_TOKEN) {
        const missingVars = [
            !ONEDRIVE_TENANT_ID && 'ONEDRIVE_TENANT_ID',
            !ONEDRIVE_CLIENT_ID && 'ONEDRIVE_CLIENT_ID',
            !ONEDRIVE_CLIENT_SECRET && 'ONEDRIVE_CLIENT_SECRET',
            !ONEDRIVE_REFRESH_TOKEN && 'ONEDRIVE_REFRESH_TOKEN',
        ].filter(Boolean).join(', ');

        console.error(`FATAL: Missing required OneDrive environment variables for token refresh: ${missingVars}.`);
        throw new Error(`Server configuration error: Application is not configured for automatic token renewal. Please set the following environment variables: ${missingVars}.`);
    }

    const tokenEndpoint = `https://login.microsoftonline.com/${ONEDRIVE_TENANT_ID}/oauth2/v2.0/token`;

    const params = new URLSearchParams();
    params.append('client_id', ONEDRIVE_CLIENT_ID);
    // The scope must include 'offline_access' to get a refresh token.
    params.append('scope', 'files.readwrite offline_access');
    params.append('client_secret', ONEDRIVE_CLIENT_SECRET);
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', ONEDRIVE_REFRESH_TOKEN);

    try {
        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        const tokenData = await response.json();

        if (!response.ok || !tokenData.access_token) {
            console.error('Failed to refresh OneDrive access token:', tokenData.error_description || 'No access token returned.');
            throw new Error(`Could not refresh authentication token for OneDrive. Check your credentials. Error: ${tokenData.error_description}`);
        }

        return tokenData.access_token;
    } catch (error) {
        console.error('Network or fetch error during token refresh:', error);
        throw new Error('Failed to connect to authentication service.');
    }
};

// Function to create a folder inside the specified ROOT_FOLDER
const createFolder = async (folderName: string, accessToken: string): Promise<DriveItem> => {
  // We construct the URL to create the new folder inside the designated root folder.
  const createFolderUrl = `${API_URL}/me/drive/root:/${encodeURIComponent(ROOT_FOLDER!)}:/children`;

  const response = await fetch(createFolderUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
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
const uploadFile = async (file: FilePayload, folderName: string, accessToken: string): Promise<DriveItem> => {
  const endpoint = `${API_URL}/me/drive/root:/${encodeURIComponent(ROOT_FOLDER!)}/${encodeURIComponent(folderName)}/${encodeURIComponent(file.name)}:/content`;
  const fileBuffer = Buffer.from(file.data, 'base64');

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
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
  
  // Add a check to ensure the root folder is configured. This is now mandatory.
  if (!ROOT_FOLDER) {
    console.error('FATAL: OneDrive root folder (ONEDRIVE_ROOT_FOLDER) is not configured in Netlify environment variables.');
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server configuration error: The OneDrive root folder is not specified. Please set ONEDRIVE_ROOT_FOLDER in your environment variables.' }),
    };
  }

  try {
    const accessToken = await getAccessToken();

    const { folderName, files } = JSON.parse(event.body || '{}') as RequestBody;

    if (!folderName || !files || !Array.isArray(files) || files.length === 0) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Missing folder name or files.' }) };
    }

    const sanitizedFolderName = folderName.replace(/[\\/:*?"<>|#%]/g, '-').trim();
    if (!sanitizedFolderName) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Invalid folder name provided.' }) };
    }

    // Create the parent folder for the submission inside the specified ROOT_FOLDER
    const folder = await createFolder(sanitizedFolderName, accessToken);
    if (!folder || !folder.webUrl) {
      throw new Error('Could not create or retrieve the OneDrive folder.');
    }

    // Upload all files in parallel to the newly created folder
    await Promise.all(files.map(file => uploadFile(file, sanitizedFolderName, accessToken)));

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
