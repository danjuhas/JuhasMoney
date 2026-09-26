

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  activeColor?: 'emerald' | 'rose' | 'slate';
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({ options, value, onChange, className = '' }: SegmentedControlProps<T>) {
  return (
    <div className={`flex bg-slate-800 p-1 rounded-xl ${className}`}>
      {options.map((opt) => {
        const isActive = value === opt.value;
        const color = opt.activeColor || 'slate';
        
        let activeStyles = 'bg-slate-700 shadow text-slate-100';
        if (color === 'emerald') activeStyles = 'bg-slate-700 shadow text-emerald-400';
        if (color === 'rose') activeStyles = 'bg-slate-700 shadow text-rose-400';

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive ? activeStyles : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
