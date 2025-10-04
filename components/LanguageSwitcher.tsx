import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'fr' : 'ar');
  };

  const languages = {
    ar: 'العربية',
    fr: 'Français',
  };

  const buttonText = language === 'ar' ? languages.fr : languages.ar;

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center justify-center rounded-lg bg-white shadow-md px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 transition-colors"
      dir="ltr"
    >
      <span className="font-semibold">{buttonText}</span>
    </button>
  );
};

export default LanguageSwitcher;