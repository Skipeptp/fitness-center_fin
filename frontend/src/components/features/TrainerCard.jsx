import { Star, Award, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Badge } from '../ui/Primitives.jsx';
import Button from '../ui/Button.jsx';
import { formatRub } from '../../utils/format.js';

export function TrainerCard({ trainer }) {
  const navigate = useNavigate();
  const emp = trainer.employee || trainer;
  const fakeUser = {
    first_name: emp.first_name || '',
    last_name: emp.last_name || '',
    photo_url: trainer.photo_url
  };
  return (
    <div className="trainer-card" onClick={() => navigate(`/trainers/${trainer.id}`)}>
      <div className="trainer-card-ava">
        <Avatar user={fakeUser} size={72} src={trainer.photo_url} />
        <div className="trainer-card-overlay">
          <Button size="sm" variant="primary" onClick={e => { e.stopPropagation(); navigate(`/trainers/${trainer.id}`); }}>
            Подробнее
          </Button>
        </div>
      </div>
      <div className="trainer-card-body">
        <h4>{emp.first_name} {emp.last_name}</h4>
        <div className="trainer-spec">{trainer.specialization}</div>
        <div className="trainer-meta">
          <span className="trainer-rating">
            <Star size={13} fill="var(--brand-warning)" color="var(--brand-warning)" />
            {Number(trainer.rating).toFixed(1)}
          </span>
          <span className="trainer-exp">
            <Award size={13} />
            {trainer.experience_years} {trainer.experience_years === 1 ? 'год' : 'лет'}
          </span>
        </div>
      </div>
      <style>{`
        .trainer-card {
          background: var(--bg-secondary); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 20px;
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          cursor: pointer; text-align: center;
          transition: transform var(--t-base) var(--ease), box-shadow var(--t-base) var(--ease),
                      border-color var(--t-base) var(--ease);
        }
        .trainer-card:hover {
          transform: translateY(-3px); box-shadow: var(--shadow-lg);
          border-color: var(--brand-primary);
        }
        .trainer-card-ava { position: relative; }
        .trainer-card-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,.5);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          opacity: 0;
          transition: opacity var(--t-base) var(--ease);
        }
        .trainer-card:hover .trainer-card-ava { transform: scale(1.04); transition: transform var(--t-base) var(--ease); }
        .trainer-card:hover .trainer-card-overlay { opacity: 1; }
        .trainer-card-body { display: flex; flex-direction: column; gap: 4px; }
        .trainer-card-body h4 { margin: 0; font-size: 15px; }
        .trainer-spec { font-size: 12px; color: var(--text-muted); }
        .trainer-meta { display: flex; gap: 12px; justify-content: center; font-size: 12px; color: var(--text-secondary); }
        .trainer-rating, .trainer-exp { display: flex; align-items: center; gap: 4px; }
        .trainer-rating { color: var(--brand-warning); }
      `}</style>
    </div>
  );
}

export function PricingCard({ membership, onBuy, highlighted = false, loading }) {
  return (
    <div className={`pricing-card ${highlighted ? 'is-highlighted' : ''}`}>
      {highlighted && <div className="pricing-popular">Популярный</div>}
      <div className="pricing-name">{membership.name}</div>
      <div className="pricing-price">
        <span className="pricing-amount">{formatRub(membership.price)}</span>
        <span className="pricing-period">/{membership.duration_days} дн.</span>
      </div>
      <p className="pricing-desc">{membership.description || 'Полный доступ к залу и тренировкам.'}</p>
      <div className="pricing-features">
        <div className="pricing-feature"><ChevronRight size={14} /> Все групповые занятия</div>
        <div className="pricing-feature"><ChevronRight size={14} /> Доступ в залы 24/7</div>
        {membership.visit_limit && (
          <div className="pricing-feature"><ChevronRight size={14} /> до {membership.visit_limit} визитов</div>
        )}
      </div>
      <Button
        variant={highlighted ? 'primary' : 'secondary'}
        fullWidth
        loading={loading}
        onClick={() => onBuy(membership)}
      >
        Купить абонемент
      </Button>
      <style>{`
        .pricing-card {
          background: var(--bg-secondary); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 24px;
          display: flex; flex-direction: column; gap: 14px;
          position: relative;
          transition: transform var(--t-base) var(--ease), box-shadow var(--t-base) var(--ease);
        }
        .pricing-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .pricing-card.is-highlighted {
          border-color: var(--brand-primary);
          background: linear-gradient(135deg, rgba(230,57,70,.06), var(--bg-secondary));
          box-shadow: 0 0 0 1px var(--brand-primary);
        }
        .pricing-popular {
          position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          background: var(--brand-primary); color: #fff;
          font-size: 11px; font-weight: 700; padding: 3px 14px;
          border-radius: var(--radius-full); text-transform: uppercase; letter-spacing: 1px;
        }
        .pricing-name { font-weight: 700; font-size: 18px; color: var(--text-primary); }
        .pricing-price { display: flex; align-items: baseline; gap: 4px; }
        .pricing-amount { font-family: var(--font-display); font-size: 2rem; font-weight: 800; color: var(--text-primary); }
        .pricing-period { font-size: 13px; color: var(--text-muted); }
        .pricing-desc { margin: 0; font-size: 13px; color: var(--text-muted); }
        .pricing-features { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .pricing-feature { font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; }
      `}</style>
    </div>
  );
}
