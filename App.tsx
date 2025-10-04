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
import CategorySelector from './components/CategorySelector';
import { UserIcon, MailIcon, IdCardIcon, PhoneIcon, NewspaperIcon, DesktopIcon, MicrophoneIcon, TvIcon } from './components/Icons';
import { uploadFilesToOneDrive } from './lib/oneDrive';


const getInitialFormData = (): FormData => ({
  fullName: '',
  email: '',
  nationalId: '',
  phone: '',
  category: 'participant',
  attachments: [],
});

const App: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [view, setView] = useState<'form' | 'admin' | 'login'>('form');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);


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

  const handleCategoryChange = useCallback((value: FormData['category']) => {
    setFormData(prev => ({ ...prev, category: value }));
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
    setFormError(null);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { fullName, email, phone, nationalId, attachments } = formData;
    if (!fullName || !email || !phone || !nationalId || attachments.length === 0) {
      setFormError(t('validationErrorAllFields'));
      return;
    }

    setFormError(null);
    setStatus('loading');
    setSubmissionMessage(t('submitLoading'));

    try {
      // Step 1: Upload files to OneDrive (if configured)
      // This message shows even if not configured, as it's part of the submission process.
      // The function will return quickly if no token is present.
      setSubmissionMessage(t('uploadingFiles'));
      const oneDriveFolderUrl = await uploadFilesToOneDrive(attachments, fullName);

      // Step 2: Save registration data to local storage
      const attachmentNames = attachments.map(file => file.name);
      
      const { attachments: _, ...rest } = formData;
      const newRegistration: Registration = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        submissionDate: new Date().toISOString(),
        ...rest,
        attachmentNames,
        oneDriveFolderUrl,
      };

      const existingRegistrationsRaw = localStorage.getItem('registrations');
      const existingRegistrations: Registration[] = existingRegistrationsRaw ? JSON.parse(existingRegistrationsRaw) : [];
      const updatedRegistrations = [...existingRegistrations, newRegistration];
      localStorage.setItem('registrations', JSON.stringify(updatedRegistrations));
      
      setStatus('success');
      if (oneDriveFolderUrl) {
        console.log('Form Submitted and files uploaded to OneDrive:', newRegistration);
      } else {
        console.log('Form Submitted. Files NOT uploaded to OneDrive (missing configuration).', newRegistration);
      }

    } catch (error) {
        console.error('Submission failed:', error);
        setStatus('error');
        const errorMessage = error instanceof Error ? error.message : t('errorMessage');
        if (errorMessage.toLowerCase().includes('token') || errorMessage.includes('401') || errorMessage.includes('OneDrive')) {
            setFormError(t('uploadError'));
        } else {
            setFormError(errorMessage);
        }
    } finally {
        setSubmissionMessage(null);
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
    errorMessage: formError || t('errorMessage'),
    errorButton: t('tryAgain'),
  };
  
  if (view === 'login') {
    return (
        <div className="min-h-screen bg-stone-50 flex flex-col justify-center items-center p-4 selection:bg-amber-100">
            <div className="max-w-3xl w-full">
                <div className="w-full flex justify-start rtl:justify-end mb-4">
                    <LanguageSwitcher />
                </div>
                <div className="bg-white rounded-xl shadow-lg p-8 transition-all duration-300">
                    <AdminLogin 
                        onLoginSuccess={() => {
                            setIsAdminAuthenticated(true);
                            setView('admin');
                        }} 
                        onBack={() => setView('form')}
                    />
                </div>
            </div>
        </div>
    );
  }

  if (view === 'admin') {
    if (!isAdminAuthenticated) {
        return (
             <div className="min-h-screen bg-stone-50 flex flex-col justify-center items-center p-4 selection:bg-amber-100">
                <div className="max-w-3xl w-full">
                     <div className="w-full flex justify-start rtl:justify-end mb-4">
                        <LanguageSwitcher />
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-8 transition-all duration-300">
                        <AdminLogin 
                            onLoginSuccess={() => {
                                setIsAdminAuthenticated(true);
                                setView('admin');
                            }} 
                            onBack={() => setView('form')}
                        />
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center p-4 pt-8 selection:bg-amber-100">
            <div className="w-full max-w-7xl">
                <div className="w-full flex justify-start rtl:justify-end mb-4">
                    <LanguageSwitcher />
                </div>
                <div className="w-full bg-white rounded-xl shadow-lg p-8 transition-all duration-300">
                    <AdminDashboard setView={setView} />
                </div>
            </div>
            <footer className="mt-6 text-center text-sm text-stone-500">
            </footer>
        </div>
    );
  }

  const categoryOptions = [
    { value: 'participant' as const, label: t('categoryParticipant'), icon: <NewspaperIcon /> },
    { value: 'exhibitor' as const, label: t('categoryExhibitor'), icon: <DesktopIcon /> },
    { value: 'speaker' as const, label: t('categorySpeaker'), icon: <MicrophoneIcon /> },
    { value: 'television' as const, label: t('categoryTelevision'), icon: <TvIcon /> },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center items-center p-4 selection:bg-amber-100">
      <div className="max-w-3xl w-full">
        <div className="w-full flex justify-start rtl:justify-end mb-4">
            <LanguageSwitcher />
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8 transition-all duration-300">
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
                        id="nationalId"
                        name="nationalId"
                        label={t('nationalIdLabel')}
                        type="text"
                        placeholder={t('nationalIdPlaceholder')}
                        value={formData.nationalId}
                        onChange={handleChange}
                        required
                        icon={<IdCardIcon />}
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
                    <CategorySelector
                        label={t('categoryLabel')}
                        options={categoryOptions}
                        selectedValue={formData.category}
                        onChange={handleCategoryChange}
                        required
                    />
                    <FileUpload
                        id="attachments"
                        name="attachments"
                        label={t('attachmentLabel')}
                        onFilesSelected={handleFilesChange}
                        selectedFiles={formData.attachments}
                        onFileRemove={handleFileRemove}
                        uploadProgress={{}}
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
                          {submissionMessage || (isLoading ? t('submitLoading') : t('submit'))}
                        </SubmitButton>
                    </div>
                    </form>
                </>
            )}
        </div>
      </div>
      <footer className="mt-6 text-center text-sm text-stone-500">
        <button onClick={handleAdminClick} className="text-amber-600 hover:text-amber-800 underline">
            {t('adminPanelLink')}
        </button>
      </footer>
    </div>
  );
};

export default App;