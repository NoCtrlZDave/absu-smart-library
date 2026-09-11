import './Common.css';

const Card = ({
  children,
  className = '',
  padding = 'md',
  hover = false,
  ...rest
}) => {
  const classes = [
    'card',
    padding ? `card--pad-${padding}` : 'card--no-pad',
    hover ? 'card--hover' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
};

export default Card;
