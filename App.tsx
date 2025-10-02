import React, { useState, useCallback, useEffect } from 'react';
import { FormData, SubmissionStatus, Registration } from './types';
import Header from './components/Header';
import FormField from './components/FormField';
import SubmitButton from './components/SubmitButton';
import StatusMessage from './components/StatusMessage';
import LanguageSwitcher from './components/LanguageSwitcher';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import { useLanguage } from './context/LanguageContext';
import FileUpload from './components/FileUpload';

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const PhoneIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
    </svg>
);

const TicketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
    </svg>
);

const getInitialFormData = (): FormData => ({
  fullName: '',
  email: '',
  phone: '',
  eventDate: new Date().toISOString().split('T')[0],
  category: 'participant',
  attachments: [],
});

const App: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [view, setView] = useState<'form' | 'admin' | 'login'>('form');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const { t, language, dir } = useLanguage();

  const isLoading = status === 'loading';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    document.title = t('formTitle');
  }, [language, dir, t]);

  useEffect(() => {
    const newPreviews: Record<string, string> = {};
    formData.attachments.forEach(file => {
      if (file.type.startsWith('image/')) {
        newPreviews[file.name] = URL.createObjectURL(file);
      }
    });

    setPreviews(prev => {
      // Revoke URLs for files that are no longer in the attachments list
      Object.keys(prev).forEach(fileName => {
        if (!newPreviews[fileName]) {
          URL.revokeObjectURL(prev[fileName]);
        }
      });
      return newPreviews;
    });
    
    // Cleanup on unmount
    return () => {
      Object.values(newPreviews).forEach(url => URL.revokeObjectURL(url));
    };
  }, [formData.attachments]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleFilesChange = useCallback((newFiles: File[]) => {
    setFormData(prev => {
        const existingFileNames = new Set(prev.attachments.map(f => f.name));
        const uniqueNewFiles = newFiles.filter(f => !existingFileNames.has(f.name));
        return {
            ...prev,
            attachments: [...prev.attachments, ...uniqueNewFiles]
        };
    });
  }, []);

  const handleFileRemove = useCallback((fileName: string) => {
    setFormData(prev => ({
        ...prev,
        attachments: prev.attachments.filter(f => f.name !== fileName)
    }));
  }, []);

  const handleReset = useCallback(() => {
    setFormData(getInitialFormData());
    setStatus('idle');
    setView('form');
    setPreviews({});
    setUploadProgress({});
    setFormError(null);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { fullName, email, phone, attachments } = formData;
    if (!fullName || !email || !phone || attachments.length === 0) {
      setFormError(t('validationErrorAllFields'));
      return;
    }
    
    setFormError(null);
    setStatus('loading');
    setUploadProgress({});

    const filesToUpload = formData.attachments;
    if (filesToUpload.length > 0) {
      const uploadPromises = filesToUpload.map(file => {
        return new Promise<void>(resolve => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += Math.random() * 25 + 5;
            if (progress >= 100) {
              progress = 100;
              clearInterval(interval);
              resolve();
            }
            setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          }, 300);
        });
      });
      await Promise.all(uploadPromises);
    } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Simulate final API call
    if (formData.email.includes('error')) {
      setStatus('error');
    } else {
      setStatus('success');
      console.log('Form Submitted:', formData);
      try {
          const existingRegistrationsRaw = localStorage.getItem('registrations');
          const existingRegistrations: Registration[] = existingRegistrationsRaw ? JSON.parse(existingRegistrationsRaw) : [];
          
          const { attachments, ...rest } = formData;
          const newRegistration: Registration = {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              status: 'pending',
              ...rest,
              attachmentNames: attachments.map(f => f.name),
          };
          const updatedRegistrations = [...existingRegistrations, newRegistration];
          localStorage.setItem('registrations', JSON.stringify(updatedRegistrations));
      } catch (error) {
          console.error("Failed to save registration to localStorage", error);
      }
    }
  }, [formData, t]);

  const handleAdminClick = () => {
    if (isAdminAuthenticated) {
      setView('admin');
    } else {
      setView('login');
    }
  };

  const statusMessages = {
    successTitle: t('successTitle'),
    successMessage: t('successMessage'),
    successButton: t('newRegistration'),
    errorTitle: t('errorTitle'),
    errorMessage: t('errorMessage'),
    errorButton: t('tryAgain'),
  };
  
  if (view === 'login') {
    return (
        <div className="min-h-screen bg-stone-50 flex flex-col justify-center items-center p-4 selection:bg-amber-100">
            <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 transition-all duration-300">
                <LanguageSwitcher />
                <AdminLogin 
                    onLoginSuccess={() => {
                        setIsAdminAuthenticated(true);
                        setView('admin');
                    }} 
                    onBack={() => setView('form')}
                />
            </div>
        </div>
    );
  }

  if (view === 'admin') {
    if (!isAdminAuthenticated) {
        return (
             <div className="min-h-screen bg-stone-50 flex flex-col justify-center items-center p-4 selection:bg-amber-100">
                <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 transition-all duration-300">
                    <LanguageSwitcher />
                    <AdminLogin 
                        onLoginSuccess={() => {
                            setIsAdminAuthenticated(true);
                            setView('admin');
                        }} 
                        onBack={() => setView('form')}
                    />
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center p-4 pt-8 selection:bg-amber-100">
            <div className="w-full max-w-7xl bg-white rounded-xl shadow-lg p-8 transition-all duration-300">
                <LanguageSwitcher />
                <AdminDashboard setView={setView} />
            </div>
            <footer className="mt-6 text-center text-sm text-stone-500">
            </footer>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center items-center p-4 selection:bg-amber-100">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 transition-all duration-300">
        <LanguageSwitcher />
        {status === 'success' || status === 'error' ? (
            <StatusMessage status={status} onReset={handleReset} messages={statusMessages} />
        ) : (
            <>
                <Header title={t('formTitle')} subtitle={t('formSubtitle')} />
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormField
                    id="fullName"
                    name="fullName"
                    label={t('fullNameLabel')}
                    type="text"
                    placeholder={t('fullNamePlaceholder')}
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    icon={<UserIcon />}
                  />
                  <FormField
                    id="email"
                    name="email"
                    label={t('emailLabel')}
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    value={formData.email}
                    onChange={handleChange}
                    required
                    icon={<MailIcon />}
                  />
                  <FormField
                    id="phone"
                    name="phone"
                    label={t('phoneLabel')}
                    type="tel"
                    placeholder={t('phonePlaceholder')}
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    icon={<PhoneIcon />}
                  />
                   <FormField
                    id="eventDate"
                    name="eventDate"
                    label={t('eventDateLabel')}
                    type="date"
                    placeholder=""
                    value={formData.eventDate}
                    onChange={handleChange}
                    required
                    icon={<CalendarIcon />}
                  />
                  <FormField
                    id="category"
                    name="category"
                    label={t('categoryLabel')}
                    type="select"
                    placeholder=""
                    value={formData.category}
                    onChange={handleChange}
                    required
                    icon={<TicketIcon />}
                  >
                      <option value="participant">{t('categoryParticipant')}</option>
                      <option value="exhibitor">{t('categoryExhibitor')}</option>
                      <option value="speaker">{t('categorySpeaker')}</option>
                      <option value="television">{t('categoryTelevision')}</option>
                  </FormField>
                  <FileUpload
                    id="attachments"
                    name="attachments"
                    label={t('attachmentLabel')}
                    onFilesSelected={handleFilesChange}
                    selectedFiles={formData.attachments}
                    onFileRemove={handleFileRemove}
                    uploadProgress={uploadProgress}
                    previews={previews}
                    disabled={isLoading}
                    required
                    translations={{
                      dropzone: t('fileDropzone'),
                      orClick: t('fileOrClick'),
                      fileListTitle: t('fileListTitle'),
                      removeFile: t('fileRemove'),
                    }}
                  />
                  
                  {formError && (
                    <div className="my-2 text-center p-3 bg-rose-50 text-rose-800 rounded-md text-sm font-medium">
                      {formError}
                    </div>
                  )}

                  <div className="pt-4">
                    <SubmitButton disabled={isLoading}>
                      {isLoading ? t('submitLoading') : t('submit')}
                    </SubmitButton>
                  </div>
                </form>
            </>
        )}
      </div>
      <footer className="mt-6 text-center text-sm text-stone-500">
        <button onClick={handleAdminClick} className="text-amber-600 hover:text-amber-800 underline">
            {t('adminPanelLink')}
        </button>
      </footer>
    </div>
  );
};
const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-400" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
);


export default App;