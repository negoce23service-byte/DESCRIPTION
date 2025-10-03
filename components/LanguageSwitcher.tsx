import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  // Each button has the same fixed width for a balanced look and easy slider positioning.
  const buttonWidthClass = 'w-24';

  return (
    <div className="relative flex w-fit rounded-lg bg-stone-200 p-1" dir="ltr">
      {/* Sliding indicator */}
      <div
        className={`absolute top-1 bottom-1 ${buttonWidthClass} transform rounded-md bg-white shadow-sm transition-transform duration-300 ease-in-out`}
        style={{
          transform: language === 'ar' ? 'translateX(100%)' : 'translateX(0)',
        }}
      />
      
      <button
        onClick={() => setLanguage('fr')}
        className={`relative z-10 ${buttonWidthClass} rounded-md py-1.5 text-center text-sm font-medium transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-200 ${
          language === 'fr' ? 'text-amber-700' : 'text-stone-600 hover:text-stone-800'
        }`}
      >
        Français
      </button>

      <button
        onClick={() => setLanguage('ar')}
        className={`relative z-10 ${buttonWidthClass} rounded-md py-1.5 text-center text-sm font-medium transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-200 ${
          language === 'ar' ? 'text-amber-700' : 'text-stone-600 hover:text-stone-800'
        }`}
      >
        العربية
      </button>
    </div>
  );
};

export default LanguageSwitcher;
