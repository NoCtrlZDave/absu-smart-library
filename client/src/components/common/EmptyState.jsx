import './Common.css';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  ...rest
}) => {
  return (
    <div className={`empty-state ${className}`} {...rest}>
      {Icon && <Icon className="empty-state-icon" size={64} />}
      {title && <h3 className="empty-state-title">{title}</h3>}
      {description && <p className="empty-state-desc">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
};

export default EmptyState;
