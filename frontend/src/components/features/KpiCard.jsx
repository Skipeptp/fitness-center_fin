import { getQuoteOfTheDay } from '../../utils/quotes.js';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from '../ui/Primitives.jsx';

// KPI-карточка для дашборда
export function KpiCard({ title, value, subtitle, icon: Icon, trend, color, loading }) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'var(--brand-success)' : trend < 0 ? 'var(--brand-danger)' : 'var(--text-muted)';
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <span className="kpi-title">{title}</span>
        {Icon && (
          <span className="kpi-icon" style={{ background: (color || 'var(--brand-primary)') + '20', color: color || 'var(--brand-primary)' }}>
            <Icon size={18} />
          </span>
        )}
      </div>
      <div className="kpi-value">
        {loading ? <Skeleton width={100} height={32} /> : value}
      </div>
      <div className="kpi-bottom">
        {subtitle && <span className="kpi-sub">{subtitle}</span>}
        {trend !== undefined && (
          <span className="kpi-trend" style={{ color: trendColor }}>
            <TrendIcon size={13} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <style>{`
        .kpi-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 20px;
          display: flex; flex-direction: column; gap: 8px;
          transition: border-color var(--t-base) var(--ease), box-shadow var(--t-base) var(--ease);
        }
        .kpi-card:hover { border-color: var(--border-strong); box-shadow: var(--shadow-sm); }
        .kpi-top { display: flex; align-items: center; justify-content: space-between; }
        .kpi-title { font-size: 13px; color: var(--text-muted); font-weight: 500; }
        .kpi-icon {
          width: 34px; height: 34px; border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
        }
        .kpi-value { font-family: var(--font-display); font-size: 1.75rem; font-weight: 700; color: var(--text-primary); }
        .kpi-bottom { display: flex; align-items: center; gap: 8px; }
        .kpi-sub { font-size: 12px; color: var(--text-muted); }
        .kpi-trend { font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 3px; }
      `}</style>
    </div>
  );
}

// Цитата дня с характером
export function MotivationalQuote() {
  const quote = getQuoteOfTheDay();
  return (
    <blockquote className="volt-quote">
      <span className="volt-quote-mark">"</span>
      {quote}
      <style>{`
        .volt-quote {
          margin: 0;
          background: linear-gradient(135deg, rgba(230,57,70,.08), rgba(247,127,0,.06));
          border: 1px solid rgba(230,57,70,.2);
          border-left: 3px solid var(--brand-primary);
          border-radius: var(--radius-lg);
          padding: 16px 20px;
          color: var(--text-secondary);
          font-style: italic;
          font-size: 14px;
          line-height: 1.6;
          position: relative;
        }
        .volt-quote-mark {
          font-size: 3rem; line-height: 1;
          color: var(--brand-primary); opacity: .3;
          font-style: normal; vertical-align: middle;
          margin-right: 4px;
        }
      `}</style>
    </blockquote>
  );
}
