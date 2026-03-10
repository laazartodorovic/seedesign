import { STYLE_OPTIONS } from '../lib/sketchProcessor';

export default function StyleSelector({ value, onChange }) {
  return (
    <div className="style-selector">
      <p className="style-selector__label">Illustration style</p>
      <div className="style-selector__grid">
        {STYLE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`style-selector__btn ${value === opt.id ? 'style-selector__btn--active' : ''}`}
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
