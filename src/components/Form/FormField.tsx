import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  helpText,
  children,
  className = ''
}) => {
  return (
    <div className={`form-field ${className} ${error ? 'has-error' : ''}`}>
      <label className="form-label">
        {label}
        {required && <span className="required-indicator">*</span>}
      </label>
      
      <div className="form-input-wrapper">
        {children}
      </div>
      
      {error && (
        <div className="form-error" role="alert">
          <span className="error-icon">⚠</span>
          <span className="error-message">{error}</span>
        </div>
      )}
      
      {helpText && !error && (
        <div className="form-help">
          <span className="help-icon">ℹ</span>
          <span className="help-message">{helpText}</span>
        </div>
      )}
    </div>
  );
};

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  fieldClassName?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  helpText,
  required = false,
  fieldClassName,
  className,
  ...inputProps
}) => {
  return (
    <FormField
      label={label}
      required={required}
      error={error}
      helpText={helpText}
      className={fieldClassName}
    >
      <input
        className={`form-input ${className || ''} ${error ? 'error' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputProps.id}-error` : undefined}
        {...inputProps}
      />
    </FormField>
  );
};

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  fieldClassName?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  error,
  helpText,
  required = false,
  options,
  fieldClassName,
  className,
  ...selectProps
}) => {
  return (
    <FormField
      label={label}
      required={required}
      error={error}
      helpText={helpText}
      className={fieldClassName}
    >
      <select
        className={`form-select ${className || ''} ${error ? 'error' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${selectProps.id}-error` : undefined}
        {...selectProps}
      >
        {options.map(option => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
};

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  fieldClassName?: string;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  error,
  helpText,
  required = false,
  fieldClassName,
  className,
  ...textareaProps
}) => {
  return (
    <FormField
      label={label}
      required={required}
      error={error}
      helpText={helpText}
      className={fieldClassName}
    >
      <textarea
        className={`form-textarea ${className || ''} ${error ? 'error' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaProps.id}-error` : undefined}
        {...textareaProps}
      />
    </FormField>
  );
};

interface CheckboxFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
  fieldClassName?: string;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  label,
  error,
  helpText,
  fieldClassName,
  className,
  ...inputProps
}) => {
  return (
    <div className={`form-field checkbox-field ${fieldClassName || ''} ${error ? 'has-error' : ''}`}>
      <label className="checkbox-label">
        <input
          type="checkbox"
          className={`form-checkbox ${className || ''} ${error ? 'error' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputProps.id}-error` : undefined}
          {...inputProps}
        />
        <span className="checkbox-indicator"></span>
        <span className="checkbox-text">{label}</span>
      </label>
      
      {error && (
        <div className="form-error" role="alert">
          <span className="error-icon">⚠</span>
          <span className="error-message">{error}</span>
        </div>
      )}
      
      {helpText && !error && (
        <div className="form-help">
          <span className="help-icon">ℹ</span>
          <span className="help-message">{helpText}</span>
        </div>
      )}
    </div>
  );
};

interface RadioGroupFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  error?: string;
  helpText?: string;
  required?: boolean;
  fieldClassName?: string;
}

export const RadioGroupField: React.FC<RadioGroupFieldProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  error,
  helpText,
  required = false,
  fieldClassName
}) => {
  return (
    <FormField
      label={label}
      required={required}
      error={error}
      helpText={helpText}
      className={fieldClassName}
    >
      <div className="radio-group" role="radiogroup" aria-labelledby={`${name}-label`}>
        {options.map(option => (
          <label key={option.value} className="radio-label">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              disabled={option.disabled}
              className="form-radio"
              aria-invalid={!!error}
            />
            <span className="radio-indicator"></span>
            <span className="radio-text">{option.label}</span>
          </label>
        ))}
      </div>
    </FormField>
  );
};