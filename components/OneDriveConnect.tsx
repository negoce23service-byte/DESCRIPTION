import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getMsalInstance, getLoginRequest, isAuthenticated } from '../lib/oneDrive';

declare const msal: any;

const OneDriveConnect: React.FC = () => {
    const { t } = useLanguage();
    const [isConnected, setIsConnected] = useState(isAuthenticated());
    const [userInfo, setUserInfo] = useState<any>(null);

    const msalInstance = getMsalInstance();

    useEffect(() => {
        if (isConnected) {
            const account = msalInstance.getAllAccounts()[0];
            if(account) {
                setUserInfo({ displayName: account.name, username: account.username });
            }
        }
    }, [isConnected, msalInstance]);

    const handleLogin = async () => {
        try {
            const response = await msalInstance.loginPopup(getLoginRequest());
            msalInstance.setActiveAccount(response.account);
            setIsConnected(true);
        } catch (error) {
            console.error("OneDrive login failed:", error);
        }
    };

    const handleLogout = async () => {
        try {
            const account = msalInstance.getAllAccounts()[0];
            if (account) {
                await msalInstance.logoutPopup({ account });
            }
            setIsConnected(false);
            setUserInfo(null);
        } catch (error) {
            console.error("OneDrive logout failed:", error);
        }
    };

    return (
        <div className="p-4 border border-stone-200 rounded-lg bg-stone-50">
            <h3 className="text-md font-semibold text-stone-800">{t('oneDriveConnectTitle')}</h3>
            <p className="text-sm text-stone-600 mt-1">{t('oneDriveConnectDescription')}</p>
            <div className="mt-4">
                {isConnected && userInfo ? (
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="text-sm">
                            <p className="font-medium text-emerald-800">{t('oneDriveConnectedAs')}</p>
                            <p className="text-stone-700">{userInfo.displayName} ({userInfo.username})</p>
                        </div>
                        <button onClick={handleLogout} className="text-sm font-medium text-rose-600 hover:text-rose-800 underline">
                            {t('oneDriveDisconnect')}
                        </button>
                    </div>
                ) : (
                    <button onClick={handleLogin} className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                         {t('oneDriveConnectButton')}
                    </button>
                )}
            </div>
             <p className="text-xs text-stone-500 mt-3">{t('oneDriveNote')}</p>
        </div>
    );
};

export default OneDriveConnect;
