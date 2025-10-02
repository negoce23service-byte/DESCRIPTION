import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const buttonClasses = (lang: 'ar' | 'fr') => 
    `px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
      language === lang 
        ? 'bg-amber-600 text-white shadow-md' 
        : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
    }`;

  return (
    <div className="flex justify-center space-x-2 mb-6" dir="ltr">
      <button onClick={() => setLanguage('fr')} className={buttonClasses('fr')}>
        Français
      </button>
      <button onClick={() => setLanguage('ar')} className={buttonClasses('ar')}>
        العربية
      </button>
    </div>
  );
};

export default LanguageSwitcher;