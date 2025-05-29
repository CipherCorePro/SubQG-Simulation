
import React from 'react';

interface SliderControlProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (val: number) => void;
  formatValue?: (val: number) => string;
  disabled?: boolean;
}

export const SliderControl: React.FC<SliderControlProps> = ({ label, min, max, step, value, onChange, formatValue, disabled = false }) => {
  const displayValue = formatValue ? formatValue(value) : value.toString();
  const controlId = `slider-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="mb-4">
      <label htmlFor={controlId} className={`block text-sm font-medium mb-1.5 ${disabled ? 'text-slate-500' : 'text-sky-300'}`}>
        {label}: <span className={`font-semibold ${disabled ? 'text-slate-400' : 'text-sky-200'}`}>{displayValue}</span>
      </label>
      <input
        type="range"
        id={controlId}
        name={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className={`w-full h-2 rounded-lg appearance-none ${disabled ? 'bg-slate-700 cursor-not-allowed' : 'bg-slate-600 cursor-pointer accent-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400'}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
        aria-disabled={disabled}
      />
    </div>
  );
};