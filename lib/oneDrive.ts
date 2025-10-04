declare const gapi: any;
declare const google: any;

// ==========================================================================================
// IMPORTANT: GOOGLE CLOUD PROJECT SETUP
// ==========================================================================================
// To use this functionality, you must set up a project in the Google Cloud Console.
// 1. Go to https://console.cloud.google.com/ and create a new project.
// 2. Enable the "Google Drive API" for your project.
// 3. Go to "APIs & Services" -> "Credentials".
// 4. Create an "API key" and paste it below. Restrict it to your website's domain for security.
// 5. Create an "OAuth 2.0 Client ID".
//    - Application type: "Web application".
//    - Add your app's URL (e.g., http://localhost:3000) to "Authorized JavaScript origins".
//    - You don't need a redirect URI for this token-based flow.
// 6. Copy the "Client ID" and paste it below.
// ==========================================================================================

const GOOGLE_API_KEY = "AIzaSyA_izgCTN2pbHcESUepPUTyTZMeBa0iSDI"; // <-- PASTE YOUR API KEY HERE
const GOOGLE_CLIENT_ID = "501974657793-gnr8g3kokb5ai0rk53lb9nl1sita57kj.apps.googleusercontent.com
"; // <-- PASTE YOUR CLIENT ID HERE
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;
let isInitializing = false;

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    });
    gapiInited = true;
}

function initializeGisClient() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: '', // Will be set before use
    });
    gisInited = true;
}

// Attach callbacks to the window object to be globally accessible
(window as any).gapiLoaded = () => {
    gapi.load('client', initializeGapiClient);
};
(window as any).gisLoaded = () => {
    initializeGisClient();
};

export function initializeGoogleClients() {
    if (isInitializing || gapiInited || gisInited) {
        return;
    }
    isInitializing = true;
    
    // Dynamically load the Google API scripts
    const scriptGapi = document.createElement('script');
    scriptGapi.src = 'https://apis.google.com/js/api.js?onload=gapiLoaded';
    scriptGapi.async = true;
    scriptGapi.defer = true;
    document.body.appendChild(scriptGapi);

    const scriptGis = document.createElement('script');
    scriptGis.src = 'https://accounts.google.com/gsi/client?onload=gisLoaded';
    scriptGis.async = true;
    scriptGis.defer = true;
    document.body.appendChild(scriptGis);
}

function isConfigured() {
    const configured = GOOGLE_API_KEY && GOOGLE_API_KEY !== "YOUR_API_KEY_HERE" &&
           GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com";
    if (!configured) {
        console.warn("Google Drive functionality is disabled. Please configure your GOOGLE_API_KEY and GOOGLE_CLIENT_ID.");
    }
    return configured;
}

export function isAuthenticated() {
    // Check if libraries are loaded and a token exists.
    return isConfigured() && gapiInited && gisInited && gapi.client.getToken() !== null;
}

export function getSignedInUser() {
    if (!isAuthenticated()) {
        return null;
    }
    // This is a simplified user object. For real user info (name, email), you would need to
    // request the 'profile' or 'email' scopes and then call a user info endpoint.
    return {
        displayName: 'Google User (Connected)'
    };
}


export function signIn(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!isConfigured()) {
            return reject(new Error("Google Drive Client ID and API Key are not configured."));
        }
        if (!gapiInited || !gisInited) {
            // Give a user-friendly message as initialization may take a moment
            return reject(new Error("Google clients are not initialized yet. Please try again in a moment."));
        }
        
        tokenClient.callback = (resp: any) => {
            if (resp.error !== undefined) {
                return reject(resp);
            }
            resolve();
        };

        if (gapi.client.getToken() === null) {
            // Prompt the user to select a Google Account and ask for consent
            tokenClient.requestAccessToken({prompt: 'consent'});
        } else {
            // Skip display of account chooser and consent dialog for an existing session
            tokenClient.requestAccessToken({prompt: ''});
        }
    });
}

export function signOut() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken(null);
        });
    }
}

async function findOrCreateFolder(folderName: string, parentId: string = 'root'): Promise<string> {
    const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentId}' in parents and trashed=false`;
    const response = await gapi.client.drive.files.list({
        q: query,
        fields: 'files(id, name)',
        pageSize: 1,
    });

    if (response.result.files && response.result.files.length > 0) {
        return response.result.files[0].id;
    } else {
        const folderMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId]
        };
        const createResponse = await gapi.client.drive.files.create({
            resource: folderMetadata,
            fields: 'id'
        });
        return createResponse.result.id;
    }
}

export async function uploadFile(
    file: File,
    folderPath: string,
    onProgress: (percentage: number) => void
): Promise<{ name: string }> {
    if (!isAuthenticated()) {
        throw new Error('Not authenticated with Google Drive.');
    }

    const pathParts = folderPath.split('/').filter(p => p);
    let parentFolderId = 'root';

    for (const part of pathParts) {
        parentFolderId = await findOrCreateFolder(part, parentFolderId);
    }
    
    const safeFileName = file.name.replace(/[^a-zA-Z0-9-_\. ]/g, '_');
    const uniqueFileName = `${Date.now()}_${safeFileName}`;
    
    const metadata = {
        name: uniqueFileName,
        parents: [parentFolderId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const accessToken = gapi.client.getToken().access_token;

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentage = Math.round((event.loaded / event.total) * 100);
                onProgress(Math.min(percentage, 100));
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                resolve({ name: response.name });
            } else {
                console.error('Google Drive upload failed:', xhr.responseText);
                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    const message = errorResponse.error?.message || `Upload failed with status ${xhr.status}`;
                    reject(new Error(message));
                } catch(e) {
                    reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
                }
            }
        };

        xhr.onerror = () => {
            reject(new Error('A network error occurred during the file upload.'));
        };

        xhr.send(form);
    });
}