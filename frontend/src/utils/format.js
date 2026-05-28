// Утилиты VOLT.

// Форматирование валюты (₽)
export const formatRub = (amount) => {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(n);
};

// Дата в человекочитаемом виде
export const formatDate = (iso, opts = {}) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', ...opts });
};

export const formatDateTime = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  });
};

export const formatTime = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

// Дней до даты (отрицательное - в прошлом)
export const daysTo = (iso) => {
  if (!iso) return 0;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

// Цвет тренировки fallback - если БД не пришла
export const WORKOUT_FALLBACK_COLOR = '#E63946';

// День недели (полный)
const WEEKDAYS = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
export const weekday = (iso) => WEEKDAYS[new Date(iso).getDay()];

// Имя клиента
export const fullName = (u) => {
  if (!u) return '';
  return [u.first_name, u.last_name].filter(Boolean).join(' ');
};

export const initials = (u) => {
  if (!u) return '?';
  const a = (u.first_name || '').charAt(0);
  const b = (u.last_name || '').charAt(0);
  return (a + b).toUpperCase() || '?';
};

// Возраст
export const ageFromBirth = (iso) => {
  if (!iso) return null;
  const b = new Date(iso);
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
  return age;
};

// Пуляем конфетти при удачной записи (8 точек)
export const fireConfetti = () => {
  const root = document.body;
  for (let i = 0; i < 8; i++) {
    const el = document.createElement('span');
    el.className = 'confetti';
    el.style.setProperty('--dx', `${(Math.random() - .5) * 240}px`);
    el.style.setProperty('--dy', `${-(Math.random() * 200 + 80)}px`);
    el.style.background = ['#E63946','#F77F00','#FFB703','#2A9D8F','#A78BFA'][i % 5];
    root.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }
};

// Парсинг ошибок с бэка - покороче
export const parseApiError = (err, fallback = 'Что-то пошло не так') => {
  return err?.response?.data?.error
      || err?.response?.data?.message
      || err?.message
      || fallback;
};
