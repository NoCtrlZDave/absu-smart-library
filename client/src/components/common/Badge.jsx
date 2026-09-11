import './Common.css';

const Badge = ({
  variant = 'info',
  children,
  size = 'md',
  className = '',
  ...rest
}) => {
  const classes = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
};

export default Badge;
