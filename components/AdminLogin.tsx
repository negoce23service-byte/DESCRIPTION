import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import SubmitButton from './SubmitButton';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBack: () => void;
}

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBack }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network delay
    setTimeout(() => {
        if (password === '1234') {
            onLoginSuccess();
        } else {
            setError(t('loginError'));
        }
        setIsLoading(false);
    }, 500);
  };

  return (
    <>
        <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-stone-800">{t('adminLoginTitle')}</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1">
                    {t('passwordLabel')}
                </label>
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 ltr:right-0 rtl:left-0 flex items-center ltr:pr-3 rtl:pl-3">
                       <LockIcon />
                    </div>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        className="block w-full appearance-none rounded-md border border-stone-300 bg-stone-50 py-2.5 ltr:pl-3 rtl:pr-3 ltr:pr-10 rtl:pl-10 text-stone-900 placeholder-stone-400 focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm transition duration-150 ease-in-out"
                        placeholder={t('passwordPlaceholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        aria-invalid={!!error}
                        aria-describedby="password-error"
                    />
                </div>
                 {error && <p id="password-error" className="mt-2 text-sm text-rose-600">{error}</p>}
            </div>
            
            <div className="pt-2">
                <SubmitButton disabled={isLoading}>
                    {isLoading ? t('submitLoading') : t('loginButton')}
                </SubmitButton>
            </div>
        </form>
         <div className="mt-4 text-center">
            <button onClick={onBack} className="text-sm text-amber-600 hover:text-amber-800 underline">
                 {t('loginBackToForm')}
            </button>
        </div>
    </>
  );
};

export default AdminLogin;
