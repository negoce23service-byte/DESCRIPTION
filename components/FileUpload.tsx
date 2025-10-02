import React, { useState, useCallback, useRef } from 'react';

const UploadIcon = () => (
    <svg className="mx-auto h-10 w-10 text-stone-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);


const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

interface FileUploadProps {
  id: string;
  name: string;
  label: string;
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
  uploadProgress: Record<string, number>;
  previews: Record<string, string>;
  onFileRemove: (fileName: string) => void;
  disabled: boolean;
  required?: boolean;
  translations: {
    dropzone: string;
    orClick: string;
    fileListTitle: string;
    removeFile: string;
  };
}

const FileUpload: React.FC<FileUploadProps> = ({ id, name, label, onFilesSelected, selectedFiles, uploadProgress, previews, onFileRemove, disabled, required = false, translations }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent<HTMLDivElement>, isEntering: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        setIsDragging(isEntering);
    };
    
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        handleDrag(e, false);
        if (disabled) return;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFilesSelected(Array.from(e.dataTransfer.files));
            e.dataTransfer.clearData();
        }
    }, [onFilesSelected, disabled]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(Array.from(e.target.files));
        }
        // Reset input value to allow selecting the same file again
        e.target.value = '';
    };
    
    const triggerFileSelect = () => {
        if (!disabled) {
            fileInputRef.current?.click();
        }
    };

    return (
        <div className="mb-4">
            <label id={`${id}-label`} className="block text-sm font-medium text-stone-700 mb-1">
                {label}{required && <span className="text-rose-500 ltr:ml-1 rtl:mr-1">*</span>}
            </label>
            <div 
                onDragEnter={(e) => handleDrag(e, true)}
                onDragLeave={(e) => handleDrag(e, false)}
                onDragOver={(e) => handleDrag(e, true)}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`relative block w-full border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${disabled ? 'bg-stone-100 cursor-not-allowed' : 'cursor-pointer'} ${isDragging ? 'border-amber-500 bg-amber-50' : 'border-stone-300 hover:border-stone-400'}`}
                aria-labelledby={`${id}-label`}
            >
                <UploadIcon />
                <p className="mt-2 text-sm text-stone-600">
                    <span className="font-semibold text-amber-600">{translations.dropzone}</span> {translations.orClick}
                </p>
                 <input ref={fileInputRef} id={id} name={name} type="file" multiple className="sr-only" onChange={handleFileSelect} disabled={disabled} />
            </div>
            {selectedFiles.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-sm font-medium text-stone-700 mb-2">{translations.fileListTitle}</h4>
                    <ul className="space-y-3">
                        {selectedFiles.map(file => {
                            const progress = uploadProgress[file.name] || 0;
                            return (
                                <li key={file.name} className="flex items-start space-x-3 rtl:space-x-reverse bg-stone-50 p-3 rounded-md border border-stone-200">
                                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-stone-200 rounded-md">
                                        {previews[file.name] ? (
                                            <img src={previews[file.name]} alt={file.name} className="h-full w-full object-cover rounded-md" />
                                        ) : (
                                            <FileIcon />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-stone-800 truncate">{file.name}</p>
                                        <p className="text-xs text-stone-500">{formatBytes(file.size)}</p>
                                        {progress > 0 && (
                                            <div className="mt-1">
                                                <div className="w-full bg-stone-200 rounded-full h-1.5">
                                                    <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => onFileRemove(file.name)}
                                      className="flex-shrink-0 text-stone-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                                      aria-label={`${translations.removeFile} ${file.name}`}
                                      disabled={disabled}
                                    >
                                      <XIcon />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default FileUpload;