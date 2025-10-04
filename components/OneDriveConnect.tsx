import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
// NOTE: The file is named oneDrive.ts but now contains all Google Drive logic.
import { signIn, signOut, isAuthenticated, getSignedInUser } from '../lib/oneDrive'; 

const GoogleIcon = () => (
    <svg className="w-4 h-4 rtl:ml-2 ltr:mr-2" viewBox="0 0 48 48">
        <path fill="#4285F4" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#34A853" d="M43.611,20.083L43.595,20L24,20v8h11.303c-1.649,4.657-6.08,8-11.303,8v0.009l0.004-0.009c6.627,0,12-5.373,12-12c0,1.134-0.165,2.234-0.45,3.268l7.961-7.961C43.862,21.35,44,22.659,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FBBC05" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#EA4335" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.655-3.108-11.28-7.481l-6.571,4.819C9.656,39.663,16.318,44,24,44z"></path>
        <path fill="none" d="M0,0h48v48H0z"></path>
    </svg>
);


const OneDriveConnect: React.FC = () => {
    const { t } = useLanguage();
    const [connected, setConnected] = useState(false);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        // Use a poller to check for auth state since gapi loads asynchronously
        const interval = setInterval(() => {
            const authStatus = isAuthenticated();
            setIsInitializing(false); // Assume initialization is done after first check
            if (authStatus !== connected) {
                setConnected(authStatus);
                if (authStatus) {
                    const user = getSignedInUser();
                    setUserInfo(user);
                } else {
                    setUserInfo(null);
                }
            }
        }, 500);
        return () => clearInterval(interval);
    }, [connected]);

    const handleLogin = async () => {
        try {
            await signIn();
            const authStatus = isAuthenticated();
            setConnected(authStatus);
            if (authStatus) {
                const user = getSignedInUser();
                setUserInfo(user);
            }
        } catch (error) {
            console.error("Google Drive login failed:", error);
            alert("Login failed. Check console for details. Ensure API key and Client ID are correct and the app origin is authorized.");
        }
    };

    const handleLogout = () => {
        signOut();
        setConnected(false);
        setUserInfo(null);
    };

    return (
        <div className="p-4 border border-stone-200 rounded-lg bg-stone-50">
            <h3 className="text-md font-semibold text-stone-800">{t('googleDriveConnectTitle')}</h3>
            <p className="text-sm text-stone-600 mt-1">{t('googleDriveConnectDescription')}</p>
            <div className="mt-4">
                {connected && userInfo ? (
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="text-sm">
                            <p className="font-medium text-emerald-800">{t('googleDriveConnectedAs')}</p>
                            <p className="text-stone-700">{userInfo.displayName}</p>
                        </div>
                        <button onClick={handleLogout} className="text-sm font-medium text-rose-600 hover:text-rose-800 underline">
                            {t('googleDriveDisconnect')}
                        </button>
                    </div>
                ) : (
                     <button 
                        onClick={handleLogin} 
                        disabled={isInitializing}
                        className="inline-flex items-center justify-center rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-wait"
                    >
                        <GoogleIcon />
                        {t('googleDriveConnectButton')}
                    </button>
                )}
            </div>
             <p className="text-xs text-stone-500 mt-3">{t('googleDriveNote')}</p>
        </div>
    );
};

export default OneDriveConnect;