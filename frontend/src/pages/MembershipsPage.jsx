import { useState, useEffect } from 'react';
import { membershipsApi } from '../api/index.js';
import { PricingCard } from '../components/features/TrainerCard.jsx';
import { Skeleton, Badge, EmptyState } from '../components/ui/Primitives.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import Button from '../components/ui/Button.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatRub, formatDate, daysTo, parseApiError } from '../utils/format.js';
import { fireConfetti } from '../utils/format.js';

export default function MembershipsPage() {
  const toast = useToast();
  const [types, setTypes] = useState([]);
  const [my, setMy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    Promise.all([
      membershipsApi.types(),
      membershipsApi.my().catch(() => ({ data: [] }))
    ]).then(([t, m]) => {
      setTypes(t.data || []);
      setMy(m.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleBuy = async () => {
    if (!confirm) return;
    setBuying(true);
    try {
      await membershipsApi.purchase({
        membership_type_id: confirm.id,
        payment_method: 'online'
      });
      const fresh = await membershipsApi.my().catch(() => ({ data: [] }));
      setMy(fresh.data || []);
      toast.success(`Абонемент "${confirm.name}" куплен!`);
      fireConfetti();
      setConfirm(null);
    } catch (e) {
      toast.error(parseApiError(e));
    } finally {
      setBuying(false);
    }
  };

  const active = my.filter(m => m.is_active);

  return (
    <div className="fade-in">
      <h1>Абонементы</h1>

      {active.length > 0 && (
        <div className="mb-3">
          <h3>Мои активные абонементы</h3>
          <div className="active-memberships">
            {active.map(m => {
              const left = daysTo(m.end_date);
              return (
                <div key={m.id} className="active-m-card">
                  <div>
                    <div className="active-m-name">{m.name}</div>
                    <div className="text-muted" style={{ fontSize: 13 }}>
                      до {formatDate(m.end_date)}
                    </div>
                  </div>
                  <Badge color={left > 7 ? 'success' : left > 0 ? 'warning' : 'danger'}>
                    {left > 0 ? `${left} дн.` : 'Истёк'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <h3>Доступные тарифы</h3>
      {loading ? (
        <div className="pricing-grid">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} height={280} radius="var(--radius-lg)" />)}
        </div>
      ) : !types.length ? (
        <EmptyState title="Тарифы не найдены" />
      ) : (
        <div className="pricing-grid">
          {types.map((t, i) => (
            <PricingCard key={t.id} membership={t}
              highlighted={i === 1}
              onBuy={(m) => setConfirm(m)} />
          ))}
        </div>
      )}

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Подтверждение покупки"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>Отмена</Button>
            <Button loading={buying} onClick={handleBuy}>Оплатить</Button>
          </>
        }>
        {confirm && (
          <div>
            <p>Ты покупаешь: <strong>{confirm.name}</strong></p>
            <p>Сумма: <strong>{formatRub(confirm.price)}</strong></p>
            <p className="text-muted" style={{ fontSize: 13 }}>
              Тестовый режим — оплата эмулируется. Реальных денег не требуется.
            </p>
          </div>
        )}
      </Modal>

      <style>{`
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; margin-top: 12px; }
        .active-memberships { display: flex; flex-direction: column; gap: 8px; }
        .active-m-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; }
        .active-m-name { font-weight: 600; color: var(--text-primary); }
      `}</style>
    </div>
  );
}
