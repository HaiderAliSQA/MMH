import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import '../styles/mmh.css';

export interface PatientResult {
  _id: string;
  name: string;
  mrNumber: string;
  age?: number;
  gender?: string;
  phone?: string;
  cnic?: string;
}

interface PatientSearchProps {
  selectedPatient: PatientResult | null;
  onSelect: (p: PatientResult) => void;
  onClear: () => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

const PatientSearch: React.FC<PatientSearchProps> = ({
  selectedPatient,
  onSelect,
  onClear,
  label = 'Select Patient',
  placeholder = 'Search by name or MR number e.g. MMH-2026-00157',
  required = true,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PatientResult[]>([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShow(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = (val: string) => {
    setQuery(val);
    clearTimeout(timerRef.current);
    if (val.length < 2) {
      setResults([]);
      setShow(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await api.get(`/patients/search?q=${encodeURIComponent(val)}`);
        const data = r.data?.data ?? r.data ?? [];
        const list = Array.isArray(data) ? data : [];
        setResults(list);
        setShow(true);
      } catch {
        setResults([]);
        setShow(false);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = (p: PatientResult) => {
    setQuery('');
    setResults([]);
    setShow(false);
    onSelect(p);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShow(false);
    onClear();
  };

  if (selectedPatient) {
    return (
      <div className="mmh-field">
        {label && (
          <label className="mmh-label">
            {label} {required && <span className="mmh-required">*</span>}
          </label>
        )}
        <div className="mmh-selected-patient-card">
          <div className="mmh-selected-patient-avatar">
            {selectedPatient.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div className="mmh-selected-patient-name">{selectedPatient.name}</div>
            <div className="mmh-selected-patient-mr">{selectedPatient.mrNumber}</div>
            <div className="mmh-selected-patient-meta">
              {selectedPatient.age}y | {selectedPatient.gender}
              {selectedPatient.phone && ` | ${selectedPatient.phone}`}
            </div>
          </div>
          <button
            className="mmh-selected-patient-clear"
            type="button"
            onClick={handleClear}
            title="Change patient"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mmh-field">
      {label && (
        <label className="mmh-label">
          {label} {required && <span className="mmh-required">*</span>}
        </label>
      )}
      <div ref={wrapRef} style={{ position: 'relative' }}>
        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%',
            transform: 'translateY(-50%)', color: '#475569',
            fontSize: 15, pointerEvents: 'none', zIndex: 1,
          }}>
            🔍
          </span>
          <input
            className="mmh-input"
            style={{ paddingLeft: 44 }}
            placeholder={placeholder}
            value={query}
            onChange={e => search(e.target.value)}
            onFocus={() => { if (results.length > 0) setShow(true); }}
            autoComplete="off"
          />
          {loading && (
            <span style={{
              position: 'absolute', right: 14, top: '50%',
              transform: 'translateY(-50%)', fontSize: 12, color: '#64748b',
            }}>
              ⏳
            </span>
          )}
        </div>

        {/* Dropdown */}
        {show && results.length > 0 && (
          <div className="mmh-patient-dropdown">
            {results.map(p => (
              <div
                key={p._id}
                className="mmh-patient-dropdown-item"
                onClick={() => handleSelect(p)}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 900, color: 'white', flexShrink: 0,
                }}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="mmh-dropdown-mr">{p.mrNumber}</div>
                <div className="mmh-dropdown-name">{p.name}</div>
                <div className="mmh-dropdown-meta">{p.age}y | {p.gender}</div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {show && query.length >= 2 && results.length === 0 && !loading && (
          <div className="mmh-patient-dropdown" style={{
            padding: 16, textAlign: 'center', color: '#475569', fontSize: 13,
          }}>
            No patient found for &quot;{query}&quot;
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientSearch;
