import { useState } from 'react';
import { Calculator } from 'lucide-react';
import Input from '../components/ui/Input.jsx';
import { Tabs } from '../components/ui/Modal.jsx';

const TABS = [
  { key: 'bmi', label: 'ИМТ' },
  { key: 'tdee', label: 'КБЖУ (TDEE)' },
  { key: 'fat', label: '% жира' }
];

const BMI_LABELS = [
  [0, 16, 'Выраженный дефицит', 'info'],
  [16, 18.5, 'Недостаточный вес', 'warning'],
  [18.5, 25, 'Норма', 'success'],
  [25, 30, 'Избыточный вес', 'warning'],
  [30, 35, 'Ожирение I', 'danger'],
  [35, 999, 'Ожирение II+', 'danger']
];

const COLOR = { success: 'var(--brand-success)', warning: 'var(--brand-warning)', danger: 'var(--brand-danger)', info: 'var(--brand-info)' };

function BmiCalc() {
  const [f, setF] = useState({ height: '', weight: '' });
  const bmi = f.height && f.weight ? (f.weight / Math.pow(f.height / 100, 2)) : null;
  const label = bmi ? BMI_LABELS.find(([lo, hi]) => bmi >= lo && bmi < hi) : null;
  return (
    <div className="calc-form">
      <Input label="Рост (см)" type="number" value={f.height} onChange={e => setF(x => ({ ...x, height: +e.target.value }))} placeholder="175" />
      <Input label="Вес (кг)" type="number" value={f.weight} onChange={e => setF(x => ({ ...x, weight: +e.target.value }))} placeholder="75" />
      {bmi && (
        <div className="calc-result" style={{ borderColor: label ? COLOR[label[3]] : 'var(--border)' }}>
          <div className="calc-result-val" style={{ color: label ? COLOR[label[3]] : 'var(--text-primary)' }}>
            {bmi.toFixed(1)}
          </div>
          <div className="calc-result-label">{label?.[2] || ''}</div>
        </div>
      )}
    </div>
  );
}

const ACTIVITY = [
  { value: 1.2,  label: 'Сидячий образ жизни' },
  { value: 1.375,label: '1-3 тренировки в неделю' },
  { value: 1.55, label: '3-5 тренировок в неделю' },
  { value: 1.725,label: '6-7 тренировок в неделю' },
  { value: 1.9,  label: 'Физический труд + спорт' }
];

function TdeeCalc() {
  const [f, setF] = useState({ height: '', weight: '', age: '', gender: 'male', activity: 1.55 });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const bmr = f.height && f.weight && f.age
    ? f.gender === 'male'
      ? 88.36 + 13.4 * +f.weight + 4.8 * +f.height - 5.7 * +f.age
      : 447.6 + 9.2 * +f.weight + 3.1 * +f.height - 4.3 * +f.age
    : null;
  const tdee = bmr ? Math.round(bmr * f.activity) : null;
  return (
    <div className="calc-form">
      <div className="calc-row">
        <Input label="Возраст" type="number" value={f.age} onChange={e => set('age', e.target.value)} placeholder="25" />
        <div className="volt-field">
          <label className="volt-field-label">Пол</label>
          <select className="volt-select" value={f.gender} onChange={e => set('gender', e.target.value)}>
            <option value="male">Мужской</option>
            <option value="female">Женский</option>
          </select>
        </div>
      </div>
      <div className="calc-row">
        <Input label="Рост (см)" type="number" value={f.height} onChange={e => set('height', e.target.value)} placeholder="175" />
        <Input label="Вес (кг)" type="number" value={f.weight} onChange={e => set('weight', e.target.value)} placeholder="75" />
      </div>
      <div className="volt-field">
        <label className="volt-field-label">Активность</label>
        <select className="volt-select" value={f.activity} onChange={e => set('activity', +e.target.value)}>
          {ACTIVITY.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </div>
      {tdee && (
        <div className="calc-result">
          <div className="calc-result-val">{tdee} ккал</div>
          <div className="calc-result-label">
            Похудение: ~{Math.round(tdee * .8)} / Поддержание: {tdee} / Набор: ~{Math.round(tdee * 1.15)}
          </div>
          <div className="tdee-macros">
            <div className="tdee-macro"><span>Белки</span><strong>{Math.round(tdee * .3 / 4)} г</strong></div>
            <div className="tdee-macro"><span>Жиры</span><strong>{Math.round(tdee * .25 / 9)} г</strong></div>
            <div className="tdee-macro"><span>Углеводы</span><strong>{Math.round(tdee * .45 / 4)} г</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}

function FatCalc() {
  const [f, setF] = useState({ neck: '', waist: '', hips: '', height: '', gender: 'male' });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  let pct = null;
  if (f.neck && f.waist && f.height) {
    if (f.gender === 'male') {
      pct = 495 / (1.0324 - 0.19077 * Math.log10(+f.waist - +f.neck) + 0.15456 * Math.log10(+f.height)) - 450;
    } else if (f.hips) {
      pct = 495 / (1.29579 - 0.35004 * Math.log10(+f.waist + +f.hips - +f.neck) + 0.22100 * Math.log10(+f.height)) - 450;
    }
  }
  const color = pct ? (pct < 12 ? 'info' : pct < 20 ? 'success' : pct < 25 ? 'warning' : 'danger') : null;
  return (
    <div className="calc-form">
      <div className="volt-field">
        <label className="volt-field-label">Пол</label>
        <select className="volt-select" value={f.gender} onChange={e => set('gender', e.target.value)}>
          <option value="male">Мужской</option>
          <option value="female">Женский</option>
        </select>
      </div>
      <div className="calc-row">
        <Input label="Рост (см)" type="number" value={f.height} onChange={e => set('height', e.target.value)} placeholder="175" />
        <Input label="Шея (см)" type="number" value={f.neck} onChange={e => set('neck', e.target.value)} placeholder="38" />
      </div>
      <div className="calc-row">
        <Input label="Талия (см)" type="number" value={f.waist} onChange={e => set('waist', e.target.value)} placeholder="80" />
        {f.gender === 'female' && (
          <Input label="Бёдра (см)" type="number" value={f.hips} onChange={e => set('hips', e.target.value)} placeholder="95" />
        )}
      </div>
      {pct && (
        <div className="calc-result" style={{ borderColor: COLOR[color] }}>
          <div className="calc-result-val" style={{ color: COLOR[color] }}>{pct.toFixed(1)}%</div>
          <div className="calc-result-label">Процент жира в теле (формула ВМС США)</div>
        </div>
      )}
    </div>
  );
}

export default function CalculatorPage() {
  const [tab, setTab] = useState('bmi');
  return (
    <div className="fade-in">
      <div className="flex items-center gap-2 mb-2">
        <Calculator size={24} style={{ color: 'var(--brand-primary)' }} />
        <h1 style={{ margin: 0 }}>Калькулятор</h1>
      </div>
      <p className="text-muted">Без сторонних библиотек. Чистая математика.</p>
      <div className="calc-wrap">
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
        {tab === 'bmi' && <BmiCalc />}
        {tab === 'tdee' && <TdeeCalc />}
        {tab === 'fat' && <FatCalc />}
      </div>
      <style>{`
        .calc-wrap { max-width: 480px; }
        .calc-form { display: flex; flex-direction: column; gap: 14px; }
        .calc-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .volt-select { width: 100%; height: 40px; padding: 0 14px; background: var(--input-bg); color: var(--text-primary); border: 1px solid var(--input-border); border-radius: var(--radius-md); font-size: 14px; }
        .volt-select:focus { outline: none; border-color: var(--input-focus); box-shadow: 0 0 0 3px rgba(230,57,70,.15); }
        .volt-field-label { font-size: 13px; font-weight: 500; color: var(--text-secondary); display: block; margin-bottom: 6px; }
        .calc-result {
          background: var(--bg-secondary); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 20px; text-align: center;
          margin-top: 8px; transition: border-color var(--t-base) var(--ease);
        }
        .calc-result-val { font-family: var(--font-display); font-size: 2.4rem; font-weight: 800; }
        .calc-result-label { color: var(--text-muted); font-size: 13px; margin-top: 4px; }
        .tdee-macros { display: flex; justify-content: center; gap: 24px; margin-top: 14px; }
        .tdee-macro { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 13px; color: var(--text-muted); }
        .tdee-macro strong { font-size: 15px; color: var(--text-primary); }
      `}</style>
    </div>
  );
}
