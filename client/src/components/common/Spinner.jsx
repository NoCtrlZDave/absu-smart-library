import './Common.css';

const Spinner = ({ size = 'md', className = '', ...rest }) => {
  return (
    <div className={`spinner-overlay ${className}`} {...rest}>
      <div className={`spinner spinner--${size}`} aria-label="Loading" />
    </div>
  );
};

export default Spinner;
