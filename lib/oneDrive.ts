// IMPORTANT: This implementation requires a valid Microsoft Graph API access token.
// It is assumed that this token is provided via the `process.env.ONEDRIVE_ACCESS_TOKEN` environment variable.
// This token must have the `Files.ReadWrite` permission for the target OneDrive account.
// For production environments, a secure backend service should be used to manage and refresh tokens,
// as storing long-lived access tokens on the client-side is not secure.

const API_URL = 'https://graph.microsoft.com/v1.0';
const ACCESS_TOKEN = process.env.ONEDRIVE_ACCESS_TOKEN;

interface DriveItem {
  id: string;
  name: string;
  webUrl: string;
}

// Function to create a folder in the root of OneDrive
const createFolder = async (folderName: string): Promise<DriveItem> => {
  if (!ACCESS_TOKEN) {
    throw new Error('OneDrive Access Token is not configured.');
  }

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

  return await response.json();
};

// Function to upload a single file to a specific folder
const uploadFile = async (file: File, folderName: string): Promise<DriveItem> => {
   if (!ACCESS_TOKEN) {
    throw new Error('OneDrive Access Token is not configured.');
  }
  
  const endpoint = `${API_URL}/me/drive/root:/${encodeURIComponent(folderName)}/${encodeURIComponent(file.name)}:/content`;

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Failed to upload file to OneDrive:', error);
    throw new Error(`Failed to upload file "${file.name}": ${error.error?.message || response.statusText}`);
  }

  return await response.json();
};

/**
 * Creates a folder in OneDrive and uploads an array of files to it.
 * @param files - An array of File objects to upload.
 * @param folderName - The name of the folder to create in OneDrive.
 * @returns The web URL of the created folder, or undefined if not configured.
 */
export const uploadFilesToOneDrive = async (files: File[], folderName: string): Promise<string | undefined> => {
    if (!ACCESS_TOKEN) {
        console.warn('OneDrive integration is not configured. Missing access token. Skipping file upload.');
        return undefined;
    }

    if (!folderName.trim()) {
        throw new Error('A valid folder name (e.g., registrant name) is required.');
    }

    const sanitizedFolderName = folderName.replace(/[\\/:*?"<>|#%]/g, '-').trim();

    const folder = await createFolder(sanitizedFolderName);
    if (!folder || !folder.webUrl) {
        throw new Error('Could not create or retrieve the OneDrive folder.');
    }

    // Upload all files in parallel
    await Promise.all(files.map(file => uploadFile(file, sanitizedFolderName)));
    
    return folder.webUrl;
};