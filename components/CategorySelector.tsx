

import React from 'react';
import { FormData } from '../types';

interface CategoryOption {
  value: FormData['category'];
  label: string;
  // FIX: Changed icon type from `React.ReactNode` to a more specific type.
  // This resolves a TypeScript error by ensuring that `React.cloneElement` receives an
  // element that is known to accept a `className` prop.
  icon: React.ReactElement<{ className?: string }>;
}

interface CategorySelectorProps {
  label: string;
  options: CategoryOption[];
  selectedValue: string;
  onChange: (value: FormData['category']) => void;
  required?: boolean;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ label, options, selectedValue, onChange, required = false }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-stone-700 mb-2">
        {label}{required && <span className="text-rose-500 ltr:ml-1 rtl:mr-1">*</span>}
      </label>
      <div role="radiogroup" aria-labelledby="category-label" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.value)}
              className={`group flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${
                isSelected
                  ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-sm'
                  : 'bg-white border-stone-300 text-stone-600 hover:border-amber-400 hover:bg-amber-50'
              }`}
            >
              <div className="mb-1.5 h-7 w-7 transition-colors">
                  {/* FIX: The icon component is cloned to inject a dynamic className for styling the selected state. 
                      This is now possible because the icon components in App.tsx have been updated to accept a className prop. */}
                  {React.isValidElement(option.icon) && React.cloneElement(
                      option.icon,
                      {
                          className: `h-full w-full ${isSelected ? 'text-amber-600' : 'text-stone-400 group-hover:text-amber-600'}`
                      }
                  )}
              </div>
              <span className="text-xs sm:text-sm font-semibold">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySelector;
