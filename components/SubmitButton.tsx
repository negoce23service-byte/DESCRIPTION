
import React from 'react';

interface SubmitButtonProps {
  disabled: boolean;
  children: React.ReactNode;
}

const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const SubmitButton: React.FC<SubmitButtonProps> = ({ disabled, children }) => {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="flex w-full justify-center rounded-md border border-transparent bg-amber-600 py-3 px-4 text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:bg-amber-400 disabled:cursor-not-allowed transition-all duration-300 ease-in-out"
    >
      {disabled && <LoadingSpinner />}
      {children}
    </button>
  );
};

export default SubmitButton;