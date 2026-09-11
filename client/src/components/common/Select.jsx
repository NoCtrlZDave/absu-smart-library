import './Common.css';

const Select = ({
  label,
  error,
  options = [],
  value,
  onChange,
  disabled = false,
  placeholder,
  className = '',
  id,
  children,
  ...rest
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label htmlFor={selectId} className="input-label">
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value ?? ''}
        onChange={onChange}
        disabled={disabled}
        className={`select-field${error ? ' input--error' : ''}`}
        {...rest}
      >
        {children
          ? children
          : (
            <>
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </>
          )}
      </select>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
};

export default Select;
