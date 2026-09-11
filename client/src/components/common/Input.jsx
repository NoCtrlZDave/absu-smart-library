import './Common.css';

const Input = ({
  label,
  error,
  helper,
  icon: Icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  className = '',
  id,
  ...rest
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className={`input-label${required ? ' input-label--required' : ''}`}
        >
          {label}
        </label>
      )}
      <div className="input-wrapper">
        {Icon && <Icon className="input-icon" />}
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`input-field${Icon ? ' has-icon' : ''}${error ? ' input--error' : ''}`}
          {...rest}
        />
      </div>
      {helper && !error && <span className="input-helper">{helper}</span>}
      {error && <span className="input-error">{error}</span>}
    </div>
  );
};

export default Input;
