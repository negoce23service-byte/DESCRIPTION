import { Buffer } from 'buffer';
import { getStore } from "@netlify/blobs";
import type { Handler } from "@netlify/functions";

// Redefine types to avoid import path issues in Netlify Functions
type RegistrationStatus = 'pending' | 'confirmed' | 'rejected';
interface Registration {
  id: string;
  status: RegistrationStatus;
  submissionDate: string;
  fullName: string;
  email: string;
  nationalId: string;
  phone: string;
  category: 'participant' | 'exhibitor' | 'speaker' | 'television';
  attachmentNames?: string[];
  oneDriveFolderUrl?: string;
}
interface FilePayload {
  name: string;
  type: string;
  data: string; // base64 encoded
}
interface RequestBody {
  fullName: string;
  email: string;
  nationalId: string;
  phone: string;
  category: 'participant' | 'exhibitor' | 'speaker' | 'television';
  attachments: FilePayload[];
}

// --- OneDrive Helper Functions ---
interface DriveItem {
  id: string;
  name: string;
  webUrl: string;
}
const API_URL = 'https://graph.microsoft.com/v1.0';
const ACCESS_TOKEN = process.env.ONEDRIVE_ACCESS_TOKEN;
const ROOT_FOLDER = process.env.ONEDRIVE_ROOT_FOLDER;

const createFolder = async (folderName: string): Promise<DriveItem> => {
  const createFolderUrl = `${API_URL}/me/drive/root:/${encodeURIComponent(ROOT_FOLDER!)}:/children`;
  const response = await fetch(createFolderUrl, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
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
        throw new Error(`Failed to create submission folder. The specified root folder "${ROOT_FOLDER}" was not found in OneDrive.`);
    }
    throw new Error(`Failed to create OneDrive folder: ${error.error?.message || response.statusText}`);
  }
  return response.json();
};

const uploadFile = async (file: FilePayload, folderName: string): Promise<DriveItem> => {
  const endpoint = `${API_URL}/me/drive/root:/${encodeURIComponent(ROOT_FOLDER!)}/${encodeURIComponent(folderName)}/${encodeURIComponent(file.name)}:/content`;
  const fileBuffer = Buffer.from(file.data, 'base64');
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': file.type },
    body: fileBuffer,
  });
  if (!response.ok) {
    const error = await response.json();
    console.error(`Failed to upload file "${file.name}":`, error);
    throw new Error(`Failed to upload file "${file.name}": ${error.error?.message || response.statusText}`);
  }
  return response.json();
};


// --- Main Handler ---
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }
  if (!ACCESS_TOKEN || !ROOT_FOLDER) {
    const missingVar = !ACCESS_TOKEN ? 'ONEDRIVE_ACCESS_TOKEN' : 'ONEDRIVE_ROOT_FOLDER';
    console.error(`FATAL: ${missingVar} is not configured in Netlify environment variables.`);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `Server configuration error: ${missingVar} is not set.` }),
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}') as RequestBody;

    if (!payload.fullName || !payload.attachments || payload.attachments.length === 0) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Missing required form data.' }) };
    }

    // 1. UPLOAD FILES TO ONEDRIVE
    const sanitizedFolderName = payload.fullName.replace(/[\\/:*?"<>|#%]/g, '-').trim();
    if (!sanitizedFolderName) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Invalid full name for folder creation.' }) };
    }
    const folder = await createFolder(sanitizedFolderName);
    await Promise.all(payload.attachments.map(file => uploadFile(file, sanitizedFolderName)));

    // 2. PREPARE REGISTRATION DATA
    const newRegistration: Registration = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        status: 'pending',
        submissionDate: new Date().toISOString(),
        fullName: payload.fullName,
        email: payload.email,
        nationalId: payload.nationalId,
        phone: payload.phone,
        category: payload.category,
        attachmentNames: payload.attachments.map(f => f.name),
        oneDriveFolderUrl: folder.webUrl,
    };

    // 3. SAVE TO NETLIFY BLOBS
    const store = getStore('registrations');
    await store.setJSON(newRegistration.id, newRegistration);
    
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Registration submitted successfully." }),
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
