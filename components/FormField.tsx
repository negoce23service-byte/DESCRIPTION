import React from 'react';

interface FormFieldProps {
  id: string;
  name: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  required?: boolean;
  // FIX: Changed type from JSX.Element to React.ReactNode to resolve namespace issue.
  icon: React.ReactNode;
  children?: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({ id, name, label, type, placeholder, value, onChange, required = false, icon, children }) => {
  const isSelect = type === 'select';
  const InputComponent = isSelect ? 'select' : 'input';

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-stone-700 mb-1">
        {label}{required && <span className="text-rose-500 ltr:ml-1 rtl:mr-1">*</span>}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 ltr:right-0 rtl:left-0 flex items-center ltr:pr-3 rtl:pl-3">
          {icon}
        </div>
        <InputComponent
          id={id}
          name={name}
          type={!isSelect ? type : undefined}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className="block w-full appearance-none rounded-md border border-stone-300 bg-stone-50 py-2.5 ltr:pl-3 rtl:pr-3 ltr:pr-10 rtl:pl-10 text-stone-900 placeholder-stone-400 focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm transition duration-150 ease-in-out"
        >
          {children}
        </InputComponent>
      </div>
    </div>
  );
};

export default FormField;