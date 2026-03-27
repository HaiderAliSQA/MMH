import React, { useState, useEffect } from 'react';
import api from '../../api';
import '../../styles/mmh.css';

interface Ward {
  _id: string;
  name: string;
  department: string;
  totalBeds: number;
}

interface Bed {
  _id: string;
  ward: string;
  bedNumber: string;
  status: string;
  patient?: { name: string; mrNumber: string };
}

const ManageWards: React.FC = () => {
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const wRes = await api.get('/wards');
      const wardsData = wRes.data || [];
      setWards(wardsData);

      if (wardsData.length > 0) {
        const bedPromises = wardsData.map((w: Ward) => api.get(`/wards/${w._id}/beds`).catch(() => ({ data: [] })));
        const results = await Promise.all(bedPromises);
        setBeds(results.flatMap((r: any) => r.data));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'var(--mmh-success-soft)';
      case 'Occupied': return 'var(--mmh-danger-soft)';
      case 'Maintenance': return 'var(--mmh-warning-soft)';
      default: return 'var(--mmh-bg3)';
    }
  };

  const getStatusBorder = (status: string) => {
    switch (status) {
      case 'Available': return 'var(--mmh-success)';
      case 'Occupied': return 'var(--mmh-danger)';
      case 'Maintenance': return 'var(--mmh-warning)';
      default: return 'var(--mmh-text3)';
    }
  };

  return (
    <div style={{ animation: 'mmh-fade-in 0.3s ease' }}>
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">Hospital Wards & Beds</h1>
          <p className="mmh-page-subtitle">Real-time overview and alignment of all hospital beds</p>
        </div>
        <button className="mmh-btn mmh-btn-ghost mmh-btn-sm" onClick={fetchData}>
          🔄 Refresh Grid
        </button>
      </div>

      {loading ? (
        <div className="mmh-empty" style={{ padding: '40px 0' }}>
          <div className="mmh-spinner mmh-spinner-dark" style={{ margin: '0 auto' }} />
        </div>
      ) : wards.length === 0 ? (
        <div className="mmh-empty">
          <div className="mmh-empty-icon">🏥</div>
          <div className="mmh-empty-text">No Wards Configured</div>
          <div className="mmh-empty-sub">Please seed the database to load active wards.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
          {wards.map(ward => {
            const wardBeds = beds.filter(b => b.ward === ward._id);
            const available = wardBeds.filter(b => b.status === 'Available').length;
            const occupied = wardBeds.filter(b => b.status === 'Occupied').length;

            return (
              <div key={ward._id} className="mmh-card" style={{ overflow: 'hidden', border: '1px solid var(--mmh-border)' }}>
                {/* WARD HEADER */}
                <div style={{
                  background: 'var(--mmh-accent)',
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--mmh-border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--mmh-bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1px solid var(--mmh-border)' }}>
                      🏥
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--mmh-text-inverted)', letterSpacing: '-0.02em' }}>{ward.name}</h2>
                      <div style={{ fontSize: 12, color: 'var(--mmh-text-inverted)', opacity: 0.8, fontWeight: 500, marginTop: 2 }}>{ward.department} Department</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.15)', padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.1 }}>{available}</div>
                      <div style={{ fontSize: 12, color: '#ffffff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>Available</div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.15)', padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#ef4444', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.1 }}>{occupied}</div>
                      <div style={{ fontSize: 10, color: '#ffffff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>Occupied</div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.1 }}>{wardBeds.length}</div>
                      <div style={{ fontSize: 9, color: '#ffffff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>Total Beds</div>
                    </div>
                  </div>
                </div>

                {/* BEDS GRID */}
                <div style={{ padding: '24px', background: 'var(--mmh-bg2)' }}>
                  {wardBeds.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--mmh-text3)', fontSize: 13, fontStyle: 'italic' }}>No beds assigned to this ward yet.</div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))',
                      gap: 16
                    }}>
                      {wardBeds.map((bed, idx) => (
                        <div
                          key={bed._id}
                          title={`Bed: ${bed.bedNumber} | Status: ${bed.status}`}
                          style={{
                            background: getStatusColor(bed.status),
                            border: `1px solid ${getStatusBorder(bed.status)}`,
                            borderRadius: 12,
                            padding: '12px 8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            transition: 'all 0.2s',
                            cursor: 'default',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                          <div style={{ fontSize: 22 }}>🛏️</div>
                          <div style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 13,
                            fontWeight: 800,
                            color: 'var(--mmh-text)',
                            letterSpacing: '-0.05em',
                            marginBottom: bed.patient ? 0 : 4
                          }}>
                            {bed.bedNumber}
                          </div>
                          {bed.patient ? (
                            <div style={{
                              fontSize: 10,
                              color: 'var(--mmh-text2)',
                              fontWeight: 700,
                              marginBottom: 4,
                              textAlign: 'center',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              width: '100%',
                              padding: '0 4px'
                            }}>
                              {bed.patient.name.split(' ')[0]}
                            </div>
                          ) : null}
                          <div style={{
                            fontSize: 9,
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            color: getStatusBorder(bed.status),
                            background: 'rgba(0,0,0,0.25)',
                            padding: '3px 8px',
                            borderRadius: 6
                          }}>
                            {bed.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManageWards;
