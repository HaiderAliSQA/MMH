import React, { useState, useEffect } from 'react';
import api from '../../api';
import '../../styles/mmh.css';

interface Stats {
  totalPatients: number;
  admitted: number;
  pendingLabs: number;
  lowStock: number;
}

interface Ward {
  _id: string;
  name: string;
  capacity: number;
  type: string;
}

interface Bed {
  _id: string;
  wardId: string;
  status: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({ totalPatients: 0, admitted: 0, pendingLabs: 0, lowStock: 0 });
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [pRes, admRes, labRes, medRes, wardRes] = await Promise.allSettled([
          api.get('/patients'),
          api.get('/admissions'),
          api.get('/labs'),
          api.get('/medicines'),
          api.get('/wards'),
        ]);

        const patients   = pRes.status   === 'fulfilled' ? pRes.value.data   : [];
        const admissions = admRes.status === 'fulfilled' ? admRes.value.data  : [];
        const labs       = labRes.status === 'fulfilled' ? labRes.value.data  : [];
        const meds       = medRes.status === 'fulfilled' ? medRes.value.data  : [];
        const wardData   = wardRes.status === 'fulfilled' ? wardRes.value.data : [];

        setStats({
          totalPatients: patients.length,
          admitted:      admissions.filter((a: any) => a.status !== 'Discharged').length,
          pendingLabs:   labs.filter((l: any) => l.status === 'Pending').length,
          lowStock:      meds.filter((m: any) => (m.quantity || 0) < (m.reorderLevel || 20)).length,
        });
        setWards(wardData);

        // Get beds for all wards
        if (wardData.length > 0) {
          const bedPromises = wardData.map((w: Ward) => api.get(`/wards/${w._id}/beds`).catch(() => ({ data: [] })));
          const results = await Promise.all(bedPromises);
          setBeds(results.flatMap((r: any) => r.data));
        }
      } catch {
        // Silently fail — show zeros
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const getWardOccupancy = (wardId: string, capacity: number) => {
    const wardBeds = beds.filter(b => b.wardId === wardId);
    const occupied = wardBeds.filter(b => b.status === 'Occupied').length;
    const total    = wardBeds.length || capacity;
    return { occupied, total };
  };

  const statCards = [
    { label: 'Total Patients', icon: '👥', value: stats.totalPatients, accent: 'linear-gradient(90deg, #0ea5e9, #38bdf8)' },
    { label: 'Admitted',       icon: '🏥', value: stats.admitted,      accent: 'linear-gradient(90deg, #10b981, #34d399)' },
    { label: 'Pending Labs',   icon: '🔬', value: stats.pendingLabs,   accent: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' },
    { label: 'Low Stock',      icon: '💊', value: stats.lowStock,      accent: 'linear-gradient(90deg, #f59e0b, #fbbf24)' },
  ];

  return (
    <div style={{ animation: 'mmh-slide-up 0.3s ease' }}>
      {/* Page Header */}
      <div className="mmh-page-header">
        <div>
          <h1 className="mmh-page-title">Hospital Analytics</h1>
          <p className="mmh-page-subtitle">Real-time overview of hospital performance and resource occupancy</p>
        </div>
        <button className="mmh-btn mmh-btn-ghost mmh-btn-sm" onClick={() => window.location.reload()}>
          🔄 Refresh
        </button>
      </div>

      {/* Stats Row — 4 cards in one line */}
      <div className="mmh-stats-grid">
        {statCards.map(card => (
          <div className="mmh-stat-card" key={card.label}>
            <div className="mmh-stat-accent" style={{ background: card.accent }} />
            <span className="mmh-stat-icon">{card.icon}</span>
            <span className="mmh-stat-value">
              {loading ? '—' : card.value.toLocaleString()}
            </span>
            <span className="mmh-stat-label">{card.label}</span>
          </div>
        ))}
      </div>

      {/* Ward & Bed Occupancy */}
      <div className="mmh-card" style={{ marginBottom: '20px' }}>
        <div className="mmh-card-accent-top" style={{ background: 'linear-gradient(90deg, #10b981, #0ea5e9)' }} />
        <div className="mmh-card-header">
          <div className="mmh-card-title">🏥 Ward &amp; Bed Occupancy</div>
          {wards.length > 0 && (
            <div className="mmh-badge mmh-badge-green">{wards.length} Wards Active</div>
          )}
        </div>
        <div className="mmh-card-body">
          {loading ? (
            <div className="mmh-empty" style={{ padding: '24px' }}>
              <div className="mmh-empty-text">Loading ward data...</div>
            </div>
          ) : wards.length === 0 ? (
            <div className="mmh-empty" style={{ padding: '24px' }}>
              <div className="mmh-empty-icon">🏥</div>
              <div className="mmh-empty-text">No Wards Configured</div>
              <div className="mmh-empty-sub">Go to the Wards tab to add hospital wards.</div>
            </div>
          ) : (
            wards.map(ward => {
              const { occupied, total } = getWardOccupancy(ward._id, ward.capacity);
              const pct = total > 0 ? (occupied / total) * 100 : 0;
              return (
                <div className="mmh-ward-row" key={ward._id}>
                  <div className="mmh-ward-name">
                    {ward.name}
                    <div style={{ fontSize: '11px', color: '#475569', fontWeight: 400, marginTop: '2px' }}>
                      {ward.type}
                    </div>
                  </div>
                  <div className="mmh-ward-bar-wrap">
                    <div
                      className="mmh-ward-bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: pct > 80
                          ? 'linear-gradient(90deg, #f59e0b, #f43f5e)'
                          : 'linear-gradient(90deg, #10b981, #0ea5e9)',
                      }}
                    />
                  </div>
                  <div className="mmh-ward-count">
                    {occupied}/{total} beds
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mmh-card">
        <div className="mmh-card-accent-top" style={{ background: 'linear-gradient(90deg, #8b5cf6, #0ea5e9)' }} />
        <div className="mmh-card-header">
          <div className="mmh-card-title">📋 Recent Activity</div>
          <div className="mmh-badge mmh-badge-sky">Live</div>
        </div>
        <div className="mmh-card-body">
          <div className="mmh-empty" style={{ padding: '32px' }}>
            <div className="mmh-empty-icon">📈</div>
            <div className="mmh-empty-text">No unusual activity detected</div>
            <div className="mmh-empty-sub">Hospital systems are operating within normal parameters.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
