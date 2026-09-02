import { TrendingUp, TrendingDown } from 'lucide-react';
import './Common.css';

const StatsCard = ({
  icon: Icon,
  label,
  value,
  trend,
  color = 'primary',
  className = '',
  ...rest
}) => {
  const trendUp = typeof trend === 'string' && trend.startsWith('+');

  return (
    <div className={`stats-card ${className}`} {...rest}>
      {Icon && (
        <div className={`stats-card-icon stats-card-icon--${color}`}>
          <Icon size={24} />
        </div>
      )}
      <div className="stats-card-info">
        {label && <span className="stats-card-label">{label}</span>}
        <span className="stats-card-value">{value}</span>
        {trend && (
          <span className={`stats-card-trend stats-card-trend--${trendUp ? 'up' : 'down'}`}>
            {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
