import React from 'react';

const StatCard = ({ title, value, icon, subtitle, color = 'var(--primary)' }) => {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 'var(--radius)',
        backgroundColor: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color,
        flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--gray-900)', marginTop: 2 }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
