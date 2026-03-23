import React, { useState, useRef, useEffect } from 'react';

export interface TypeSearchOption {
  value: string;
  label: string;
  sub?: string;
  icon?: string;
}

interface TypeSearchProps {
  options: TypeSearchOption[];
  value: string;
  onChange: (value: string, label: string) => void;
  placeholder: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

const TypeSearch: React.FC<TypeSearchProps> = ({
  options, value, onChange, placeholder, label, required, disabled,
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Sync display label from value
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase()) ||
    (o.sub && o.sub.toLowerCase().includes(query.toLowerCase()))
  );

  const handleFocus = () => {
    if (!disabled) setOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(true);
    // If user clears, reset selection
    if (!e.target.value && value) {
      onChange('', '');
    }
  };

  const handleSelect = (opt: TypeSearchOption) => {
    onChange(opt.value, opt.label);
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    onChange('', '');
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="mmh-field">
      {label && (
        <label className="mmh-label">
          {label} {required && <span className="mmh-required">*</span>}
        </label>
      )}
      <div className="mmh-ts-wrap" ref={wrapRef}>
        {!selected ? (
          <>
            <span className="mmh-ts-icon">🔍</span>
            <input
              className="mmh-ts-input"
              placeholder={placeholder}
              value={query}
              onChange={handleInputChange}
              onFocus={handleFocus}
              disabled={disabled}
              autoComplete="off"
            />
            {open && (
              <div className="mmh-ts-dropdown">
                {filtered.length === 0 ? (
                  <div className="mmh-ts-empty">No results found</div>
                ) : (
                  filtered.map(opt => (
                    <div
                      key={opt.value}
                      className="mmh-ts-option"
                      onMouseDown={e => { e.preventDefault(); handleSelect(opt); }}
                    >
                      {opt.icon && <span style={{ fontSize: 16 }}>{opt.icon}</span>}
                      <div>
                        <div className="mmh-ts-option-label">{opt.label}</div>
                        {opt.sub && <div className="mmh-ts-option-sub">{opt.sub}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        ) : (
          <div className="mmh-ts-selected">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {selected.icon && <span style={{ fontSize: 16 }}>{selected.icon}</span>}
              <div>
                <div className="mmh-ts-selected-label">{selected.label}</div>
                {selected.sub && <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{selected.sub}</div>}
              </div>
            </div>
            <button type="button" className="mmh-ts-clear" onClick={handleClear} title="Clear">×</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TypeSearch;
