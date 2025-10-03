declare const msal: any;
declare const MicrosoftGraph: any;

// ==========================================================================================
// IMPORTANT: AZURE APP REGISTRATION
// ==========================================================================================
// To use this functionality, you must register an application in Azure Active Directory.
// 1. Go to https://portal.azure.com/ and navigate to "Azure Active Directory".
// 2. Go to "App registrations" and create a "New registration".
// 3. Name your app (e.g., "Registration Form Uploader").
// 4. Set "Supported account types" to "Accounts in any organizational directory and personal Microsoft accounts".
// 5. Under "Redirect URI", select "Single-page application (SPA)" and enter your app's URL (e.g., http://localhost:3000 or your production URL).
// 6. Click "Register".
// 7. Copy the "Application (client) ID" from the app overview and paste it below.
// ==========================================================================================

// FIX: Changed from 'const' to 'let' to avoid a TypeScript error where comparisons
// against this placeholder value were flagged as unintentional. This allows the
// configuration checks below to function as expected.
let AAD_CLIENT_ID = "f3a703a4-a944-4a5b-8c29-4257c29fcd15"; // <-- PASTE YOUR CLIENT ID HERE

const msalConfig = {
    auth: {
        clientId: AAD_CLIENT_ID,
        redirectUri: window.location.origin,
        authority: "https://login.microsoftonline.com/common",
    },
    cache: {
        cacheLocation: 'localStorage', // Using localStorage for demo purposes to persist login across sessions.
        storeAuthStateInCookie: false,
    },
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

const loginRequest = {
    scopes: ['User.Read', 'Files.ReadWrite.All'],
};

let graphClient: any | undefined = undefined;

async function getToken() {
    const account = msalInstance.getAllAccounts()[0];
    if (!account) {
        throw new Error('User not signed in.');
    }

    try {
        const response = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: account,
        });
        return response.accessToken;
    } catch (error) {
        if (error instanceof msal.InteractionRequiredAuthError) {
            // fallback to interactive method on silent token failure
            const response = await msalInstance.acquireTokenPopup(loginRequest);
            msalInstance.setActiveAccount(response.account);
            return response.accessToken;
        }
        throw error;
    }
}

function initializeGraphClient() {
    const isConfigured = AAD_CLIENT_ID && 
                         AAD_CLIENT_ID !== "YOUR_CLIENT_ID_HERE" && 
                         AAD_CLIENT_ID !== "71dda0f5-927b-4afc-b744-92c763718b3f";
                         
    if (!isConfigured) {
        console.warn("OneDrive functionality is disabled. Please configure your AAD_CLIENT_ID in lib/oneDrive.ts with a valid ID from your Azure App Registration.");
        throw new Error("OneDrive Client ID is not configured. Please use a valid Application (client) ID from your Azure portal.");
    }
    if (!graphClient) {
        const authProvider = {
            getAccessToken: async () => {
                return await getToken();
            },
        };
        graphClient = MicrosoftGraph.Client.initWithMiddleware({ authProvider });
    }
}

export function getMsalInstance() {
    return msalInstance;
}

export function getLoginRequest() {
    return loginRequest;
}

export function isAuthenticated() {
    // These are placeholder IDs and should be considered as not configured.
    const isConfigured = AAD_CLIENT_ID && 
                         AAD_CLIENT_ID !== "YOUR_CLIENT_ID_HERE" && 
                         AAD_CLIENT_ID !== "71dda0f5-927b-4afc-b744-92c763718b3f";

    if (!isConfigured) {
        return false;
    }
    return msalInstance.getAllAccounts().length > 0;
}

export async function uploadFile(
    file: File,
    folderName: string,
    onProgress: (percentage: number) => void
): Promise<any> {
    if (!isAuthenticated()) {
        throw new Error('Not authenticated with OneDrive.');
    }
    
    initializeGraphClient();

    // Sanitize file and folder names
    const safeFolderName = folderName.replace(/[^a-zA-Z0-9-_\. ]/g, '_');
    const safeFileName = file.name.replace(/[^a-zA-Z0-9-_\. ]/g, '_');

    const uniqueFileName = `${Date.now()}_${safeFileName}`;
    const uploadPath = `/drive/root:/${safeFolderName}/${uniqueFileName}:/createUploadSession`;

    const uploadSessionPayload = {
        item: {
            "@microsoft.graph.conflictBehavior": "rename",
        },
    };

    const uploadSession = await graphClient.api(uploadPath).post(uploadSessionPayload);

    const largeFileUploadTask = new MicrosoftGraph.LargeFileUploadTask(
        graphClient,
        file,
        uploadSession,
        {
            rangeSize: 320 * 1024, // 320 KB chunks (Microsoft's recommendation)
            onProgress: (range: any) => {
                if (!file.size) {
                  onProgress(100);
                  return;
                }
                const percentage = Math.round(((range.maxValue + 1) / file.size) * 100);
                onProgress(Math.min(percentage, 100));
            },
        }
    );

    const uploadResult = await largeFileUploadTask.upload();
    return uploadResult;
}
