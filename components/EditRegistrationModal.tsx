import React, { useState, useEffect, useCallback } from 'react';
import { Registration, FormData, RegistrationStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';
import FormField from './FormField';
import CategorySelector from './CategorySelector';
import { UserIcon, MailIcon, IdCardIcon, PhoneIcon, NewspaperIcon, DesktopIcon, MicrophoneIcon, TvIcon } from './Icons';

interface EditRegistrationModalProps {
  registration: Registration;
  onClose: () => void;
  onSave: (updatedRegistration: Registration) => void;
}

const EditRegistrationModal: React.FC<EditRegistrationModalProps> = ({ registration, onClose, onSave }) => {
  const [editedData, setEditedData] = useState<Registration>(registration);
  const { t } = useLanguage();

  useEffect(() => {
    setEditedData(registration);
  }, [registration]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => ({ ...prev, [name]: value } as Registration));
  }, []);

  const handleCategoryChange = useCallback((value: FormData['category']) => {
    setEditedData(prev => ({ ...prev, category: value }));
  }, []);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStatus = e.target.value as RegistrationStatus;
      setEditedData(prev => ({...prev, status: newStatus}));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedData);
  };

  const categoryOptions = [
    { value: 'participant' as const, label: t('categoryParticipant'), icon: <NewspaperIcon /> },
    { value: 'exhibitor' as const, label: t('categoryExhibitor'), icon: <DesktopIcon /> },
    { value: 'speaker' as const, label: t('categorySpeaker'), icon: <MicrophoneIcon /> },
    { value: 'television' as const, label: t('categoryTelevision'), icon: <TvIcon /> },
  ];
  
  const statusOptions = [
    { value: 'pending', label: t('pending') },
    { value: 'confirmed', label: t('confirmed') },
    { value: 'rejected', label: t('rejected') },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50" aria-modal="true" role="dialog">
        <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl m-4 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-lg font-medium leading-6 text-stone-900" id="modal-title">
                        {t('editRegistrationTitle')}
                    </h3>
                    <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="space-y-4">
                    <FormField id="fullName" name="fullName" label={t('fullNameLabel')} type="text" placeholder={t('fullNamePlaceholder')} value={editedData.fullName} onChange={handleChange} required icon={<UserIcon />} />
                    <FormField id="email" name="email" label={t('emailLabel')} type="email" placeholder={t('emailPlaceholder')} value={editedData.email} onChange={handleChange} required icon={<MailIcon />} />
                    <FormField id="nationalId" name="nationalId" label={t('nationalIdLabel')} type="text" placeholder={t('nationalIdPlaceholder')} value={editedData.nationalId} onChange={handleChange} required icon={<IdCardIcon />} />
                    <FormField id="phone" name="phone" label={t('phoneLabel')} type="tel" placeholder={t('phonePlaceholder')} value={editedData.phone} onChange={handleChange} required icon={<PhoneIcon />} />
                    
                    <CategorySelector label={t('categoryLabel')} options={categoryOptions} selectedValue={editedData.category} onChange={handleCategoryChange} required />

                    <div>
                         <label htmlFor="status" className="block text-sm font-medium text-stone-700 mb-1">
                            {t('status')}
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={editedData.status}
                            onChange={handleStatusChange}
                            className="block w-full rounded-md border border-stone-300 bg-stone-50 py-2.5 px-3 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm transition duration-150 ease-in-out"
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3 rtl:space-x-reverse border-t pt-4">
                    <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                        onClick={onClose}
                    >
                        {t('cancel')}
                    </button>
                    <button
                        type="submit"
                        className="inline-flex justify-center rounded-md border border-transparent bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                    >
                        {t('save')}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default EditRegistrationModal;