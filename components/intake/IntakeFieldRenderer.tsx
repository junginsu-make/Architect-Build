import React from 'react';
import type { IntakeField } from '../../types/intake';

interface IntakeFieldRendererProps {
  field: IntakeField;
  value: string | string[];
  onChange: (fieldId: string, value: string | string[]) => void;
}

const IntakeFieldRenderer: React.FC<IntakeFieldRendererProps> = ({ field, value, onChange }) => {
  const label = field.label;
  const placeholder = field.placeholder || '';
  const description = field.description || '';

  const priorityColors: Record<string, string> = {
    P1: 'bg-blue-50 text-blue-600 border-blue-200',
    P2: 'bg-slate-50 text-slate-500 border-slate-200',
    P3: 'bg-slate-50 text-slate-400 border-slate-100',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-bold text-slate-800">{label}</label>
        <span className={`px-1.5 py-0.5 text-[9px] font-black rounded border ${priorityColors[field.priority]}`}>
          {field.priority}
        </span>
        {field.required && <span className="text-blue-500 text-xs">*</span>}
      </div>
      {description && <p className="text-xs text-slate-400">{description}</p>}

      {field.type === 'text' && (
        <input
          type="text"
          value={(value as string) || ''}
          onChange={(e) => onChange(field.id, e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      )}

      {field.type === 'textarea' && (
        <textarea
          value={(value as string) || ''}
          onChange={(e) => onChange(field.id, e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-y"
        />
      )}

      {field.type === 'number' && (
        <input
          type="number"
          value={(value as string) || ''}
          onChange={(e) => onChange(field.id, e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      )}

      {field.type === 'select' && (
        <select
          value={(value as string) || ''}
          onChange={(e) => onChange(field.id, e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="">{placeholder || '선택하세요'}</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {field.type === 'radio' && (
        <div className="flex flex-wrap gap-2">
          {field.options?.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all text-sm ${
                value === opt.value
                  ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name={field.id}
                value={opt.value}
                checked={value === opt.value}
                onChange={(e) => onChange(field.id, e.target.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}

      {field.type === 'multi-select' && (
        <div className="flex flex-wrap gap-2">
          {field.options?.map((opt) => {
            const selected = Array.isArray(value) && value.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all text-sm ${
                  selected
                    ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={selected}
                  onChange={(e) => {
                    const current = Array.isArray(value) ? value : [];
                    const next = e.target.checked
                      ? [...current, opt.value]
                      : current.filter((v) => v !== opt.value);
                    onChange(field.id, next);
                  }}
                  className="sr-only"
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IntakeFieldRenderer;
