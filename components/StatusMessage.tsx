import React from 'react';
import { SubmissionStatus } from '../types';

interface StatusMessageProps {
  status: SubmissionStatus;
  onReset: () => void;
  messages: {
    successTitle: string;
    successMessage: string;
    successButton: string;
    errorTitle: string;
    errorMessage: string;
    errorButton: string;
  };
}

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.47 14.47l-4.24-4.24 1.41-1.41L10.53 14.6l6.01-6.01 1.41 1.41-7.42 7.42z" clipRule="evenodd" />
    </svg>
);

const XCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-rose-500" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.71 13.29l-1.42 1.42L12 13.41l-3.29 3.3-1.42-1.42L10.59 12 7.3 8.71l1.42-1.42L12 10.59l3.29-3.3 1.42 1.42L13.41 12l3.3 3.29z" clipRule="evenodd" />
    </svg>
);


const StatusMessage: React.FC<StatusMessageProps> = ({ status, onReset, messages }) => {
    if (status === 'success') {
        return (
            <div className="text-center p-6 bg-emerald-50 rounded-lg">
                <div className="flex justify-center items-center mb-4">
                    <CheckCircleIcon />
                </div>
                <h3 className="text-lg font-medium text-emerald-800">{messages.successTitle}</h3>
                <p className="mt-2 text-sm text-emerald-700">
                    {messages.successMessage}
                </p>
                <div className="mt-4">
                    <button
                        type="button"
                        onClick={onReset}
                        className="inline-flex items-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    >
                        {messages.successButton}
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
             <div className="text-center p-6 bg-rose-50 rounded-lg">
                <div className="flex justify-center items-center mb-4">
                   <XCircleIcon />
                </div>
                <h3 className="text-lg font-medium text-rose-800">{messages.errorTitle}</h3>
                <p className="mt-2 text-sm text-rose-700">
                    {messages.errorMessage}
                </p>
                <div className="mt-4">
                    <button
                        type="button"
                        onClick={onReset}
                        className="inline-flex items-center rounded-md border border-transparent bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                    >
                        {messages.errorButton}
                    </button>
                </div>
            </div>
        );
    }
    
    return null;
};

export default StatusMessage;