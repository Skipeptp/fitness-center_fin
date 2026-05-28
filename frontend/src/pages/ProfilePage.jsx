import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { clientsApi } from '../api/index.js';
import { useToast } from '../context/ToastContext.jsx';
import Input, { PasswordInput, Textarea } from '../components/ui/Input.jsx';
import { Avatar, Badge } from '../components/ui/Primitives.jsx';
import Button from '../components/ui/Button.jsx';
import { parseApiError, formatDate, ageFromBirth } from '../utils/format.js';

export default function ProfilePage() {
  const { user, updateUser, isEmployee } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    goals: user?.goals || '',
    gender: user?.gender || ''
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await clientsApi.update(user.id, form);
      updateUser(res.data);
      toast.success('Профиль обновлён.');
      setEditing(false);
    } catch (e) {
      toast.error(parseApiError(e));
    } finally { setSaving(false); }
  };

  const age = ageFromBirth(user?.birth_date);

  return (
    <div className="fade-in">
      <h1>Профиль</h1>

      <div className="profile-hero">
        <Avatar user={user} size={80} />
        <div className="profile-hero-info">
          <h2 style={{ margin: 0 }}>{user?.first_name} {user?.last_name || user?.login}</h2>
          <div className="flex gap-2 items-center flex-wrap mt-1">
            <Badge color="primary">{user?.role || 'CLIENT'}</Badge>
            {age && <span className="text-muted" style={{ fontSize: 13 }}>{age} лет</span>}
            {user?.email && <span className="text-muted" style={{ fontSize: 13 }}>{user.email}</span>}
          </div>
        </div>
        {!isEmployee && !editing && (
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Редактировать</Button>
        )}
      </div>

      {!isEmployee && (
        <div className="profile-card mt-3">
          <h3>Личные данные</h3>
          {editing ? (
            <div className="profile-form">
              <div className="profile-row">
                <Input label="Имя" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
                <Input label="Фамилия" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
              </div>
              <Input label="Телефон" value={form.phone} onChange={e => set('phone', e.target.value)} />
              <div className="volt-field">
                <label className="volt-field-label">Пол</label>
                <select className="volt-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="">Не указан</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                  <option value="other">Другой</option>
                </select>
              </div>
              <Textarea label="Цели тренировок" value={form.goals} rows={3}
                onChange={e => set('goals', e.target.value)}
                placeholder="Похудеть, набрать массу, улучшить выносливость..." />
              <div className="flex gap-2">
                <Button loading={saving} onClick={save}>Сохранить</Button>
                <Button variant="secondary" onClick={() => setEditing(false)}>Отмена</Button>
              </div>
            </div>
          ) : (
            <div className="profile-info">
              {[
                ['Имя', `${user?.first_name || '-'} ${user?.last_name || ''}`],
                ['Email', user?.email || '-'],
                ['Телефон', user?.phone || '-'],
                ['Дата рождения', user?.birth_date ? formatDate(user.birth_date) : '-'],
                ['Пол', user?.gender || '-'],
                ['Цели', user?.goals || 'Не указаны']
              ].map(([k, v]) => (
                <div key={k} className="profile-row-info">
                  <span className="profile-label">{k}</span>
                  <span className="profile-value">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        .profile-hero {
          display: flex; align-items: center; gap: 20px;
          background: var(--bg-secondary); border: 1px solid var(--border);
          border-radius: var(--radius-xl); padding: 24px;
        }
        .profile-hero-info { flex: 1; }
        .profile-card {
          background: var(--bg-secondary); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 20px;
        }
        .profile-card h3 { margin: 0 0 16px; }
        .profile-form { display: flex; flex-direction: column; gap: 14px; }
        .profile-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .volt-select { width: 100%; height: 40px; padding: 0 14px; background: var(--input-bg); color: var(--text-primary); border: 1px solid var(--input-border); border-radius: var(--radius-md); font-size: 14px; }
        .volt-select:focus { outline: none; border-color: var(--input-focus); box-shadow: 0 0 0 3px rgba(230,57,70,.15); }
        .volt-field-label { font-size: 13px; font-weight: 500; color: var(--text-secondary); display: block; margin-bottom: 6px; }
        .profile-info { display: flex; flex-direction: column; gap: 12px; }
        .profile-row-info { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--divider); }
        .profile-row-info:last-child { border: none; }
        .profile-label { font-size: 13px; color: var(--text-muted); }
        .profile-value { font-size: 14px; color: var(--text-primary); text-align: right; max-width: 60%; }
        @media (max-width: 600px) { .profile-row { grid-template-columns: 1fr; } .profile-hero { flex-direction: column; text-align: center; } }
      `}</style>
    </div>
  );
}
