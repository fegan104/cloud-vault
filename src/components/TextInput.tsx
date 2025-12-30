import React, { useState, KeyboardEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  name?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  error?: string | null;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  name,
  className = '',
  onKeyDown,
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [inputType, setInputType] = useState<'password' | 'text'>('password');

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    setInputType(showPassword ? 'password' : 'text');
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label htmlFor={name} className="mb-1 text-sm font-medium text-on-surface/80">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          type={inputType}
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={`flex-1 px-4 py-2 rounded border focus:outline-none focus:ring-2 focus:border-transparent transition duration-200 text-sm pr-10 ${error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
            }`}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

type TextInputProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  className?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
};

export const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  className = "",
  onKeyDown = () => { },
}) => {
  return (
    <div className="flex flex-col gap-1 flex-1">
      {label && (
        <label className="text-sm font-medium text-on-surface/80">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onKeyDown={e => onKeyDown(e)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm ${className}`}
      />
    </div>
  );
};