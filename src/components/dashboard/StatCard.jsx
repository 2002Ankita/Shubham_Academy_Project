import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'primary', // 'primary', 'mustard', 'orange', 'green'
  trend,
  trendType = 'up', // 'up' or 'down'
}) {
  const getIconBg = () => {
    switch (color) {
      case 'mustard': return 'rgba(213, 166, 28, 0.15)';
      case 'orange': return 'rgba(217, 119, 24, 0.15)';
      case 'green': return 'rgba(22, 133, 84, 0.15)';
      case 'primary':
      default: return 'rgba(169, 31, 31, 0.1)';
    }
  };

  const getIconColor = () => {
    switch (color) {
      case 'mustard': return 'var(--sa-mustard-yellow)';
      case 'orange': return 'var(--sa-warm-orange)';
      case 'green': return 'var(--sa-success-green)';
      case 'primary':
      default: return 'var(--sa-primary-red)';
    }
  };

  return (
    <div className="sa-card p-4 h-100 position-relative overflow-hidden">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <span className="text-sa-muted small fw-semibold text-uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div
            className="rounded-3 p-2 d-flex align-items-center justify-content-center"
            style={{ backgroundColor: getIconBg(), color: getIconColor() }}
          >
            <Icon size={22} />
          </div>
        )}
      </div>

      <div className="d-flex align-items-baseline gap-2 mb-1">
        <h2 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-3">
          {value}
        </h2>
        {trend && (
          <span
            className={`small fw-bold ${trendType === 'up' ? 'text-success' : 'text-danger'}`}
            style={{ fontSize: '0.78rem' }}
          >
            {trendType === 'up' ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>

      {subtitle && <p className="small text-sa-muted mb-0">{subtitle}</p>}
    </div>
  );
}
