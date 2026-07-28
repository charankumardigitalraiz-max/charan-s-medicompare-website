import React from "react";

const FormField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helpText,
  className = "",
  inputClassName = "",
  disabled = false,
  rows,
  options = [],
  ...props
}) => {
  const fieldId = `field-${name}`;
  const isSelect = type === "select";
  const isTextarea = type === "textarea";

  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="form-label">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </label>
      )}
      {isSelect ? (
        <select
          id={fieldId}
          name={name}
          className={`form-control ${inputClassName}`}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value || option} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
      ) : isTextarea ? (
        <textarea
          id={fieldId}
          name={name}
          className={`form-control ${inputClassName}`}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows || 3}
          {...props}
        />
      ) : (
        <input
          id={fieldId}
          name={name}
          type={type}
          className={`form-control ${inputClassName}`}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          {...props}
        />
      )}
      {error && <div className="text-danger small mt-1">{error}</div>}
      {helpText && !error && <div className="text-muted small mt-1">{helpText}</div>}
    </div>
  );
};

export default FormField;

