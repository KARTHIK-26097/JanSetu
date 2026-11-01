import React from 'react';
import {
  ShieldCheck,
  BarChart3,
  Layers,
  MapPin,
  Volume2,
} from 'lucide-react';
import { getPublicAggregateStats } from '../../services/storageService';
import { speakInstruction } from '../../services/languageService';

export const PublicAccountabilityDashboard: React.FC = () => {
  const stats = getPublicAggregateStats();

  const categories = [
    { key: 'roads', label: 'Roads & Potholes', icon: '🛣️' },
    { key: 'water', label: 'Water & Drainage', icon: '🚰' },
    { key: 'street_lighting', label: 'Street Lighting', icon: '💡' },
    { key: 'waste', label: 'Waste & Sanitation', icon: '🗑️' },
    { key: 'bridges', label: 'Bridges & Overpasses', icon: '🌉' },
    { key: 'pollution', label: 'Environmental Pollution', icon: '🏭' },
    { key: 'other', label: 'Other Civic Grievances', icon: '📌' },
  ];

  const handleSpeakStats = () => {
    speakInstruction(
      `Civic Voice Public Accountability. Total grievances: ${stats.total}. Resolution rate: ${stats.resolutionRate} percent. Active dispatches: ${stats.inProgress + stats.triaged}.`,
      'en'
    );
  };

  return (
    <div className="citizen-public-page" style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Title & Header */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Public updates</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            See how local reports are being handled.
          </p>
        </div>
        <button
          type="button"
          className="btn-speaker"
          onClick={handleSpeakStats}
          title="Read key metrics aloud"
          aria-label="Listen to public metrics"
        >
          <Volume2 size={16} />
        </button>
      </div>

      {/* Honest Privacy Guarantee Banner */}
      <div
        className="card"
        style={{
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          border: '1.5px solid #16a34a',
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#16a34a',
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={26} />
        </div>
        <div>
          <strong style={{ fontSize: '1rem', color: '#16a34a', display: 'block', marginBottom: '0.2rem' }}>
            Private details are hidden
          </strong>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Names, phone numbers, and private messages are not shown here.
          </p>
        </div>
      </div>

      {/* City-wide Aggregate KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid var(--brand-primary)' }}>
          <span className="stat-label">Reports</span>
          <div className="stat-value">{stats.total}</div>
          <span className="stat-desc">All reports</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #16a34a' }}>
          <span className="stat-label" style={{ color: '#16a34a' }}>
            Resolved
          </span>
          <div className="stat-value" style={{ color: '#16a34a' }}>
            {stats.resolutionRate}%
          </div>
          <span className="stat-desc">{stats.resolved} reports</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <span className="stat-label">Average time</span>
          <div className="stat-value">{stats.avgResolutionHours}h</div>
          <span className="stat-desc">To resolve a report</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <span className="stat-label">In progress</span>
          <div className="stat-value">{stats.inProgress + stats.triaged}</div>
          <span className="stat-desc">Being reviewed or fixed</span>
        </div>
      </div>

      <details className="simple-optional-details public-more-details">
        <summary>See more numbers</summary>
      {/* Two Column Visual Breakdowns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* Category Breakdown */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="var(--brand-primary)" />
            <span>Grievances by Infrastructure Category</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {categories.map((cat) => {
              const count = stats.categoryBreakdown[cat.key] || 0;
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={cat.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {cat.icon} {cat.label}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'linear-gradient(to right, var(--brand-primary), #fb923c)',
                        borderRadius: 'var(--radius-full)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Severity & Status Distributions */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={18} color="var(--brand-primary)" />
            <span>Triage Severity Distribution</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--urgency-critical-bg)', border: '1px solid var(--urgency-critical-border)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase' }}>
                Critical (4h SLA)
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444' }}>
                {stats.critical}
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: 'var(--urgency-high-bg)', border: '1px solid var(--urgency-high-border)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase' }}>
                High (24h SLA)
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>
                {stats.high}
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: 'var(--urgency-medium-bg)', border: '1px solid var(--urgency-medium-border)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700, textTransform: 'uppercase' }}>
                Medium (72h SLA)
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284c7' }}>
                {stats.medium}
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: 'var(--urgency-low-bg)', border: '1px solid var(--urgency-low-border)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase' }}>
                Low (168h SLA)
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a' }}>
                {stats.low}
              </div>
            </div>
          </div>

          <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
            Current Lifecycle Pipeline
          </h4>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-status-submitted">Submitted: {stats.submitted}</span>
            <span className="badge badge-status-triaged">Triaged / Assigned: {stats.triaged}</span>
            <span className="badge badge-status-in_progress">In Progress: {stats.inProgress}</span>
            <span className="badge badge-status-resolved">Resolved: {stats.resolved}</span>
          </div>
        </div>
      </div>

      {/* Municipal Zone Performance Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={18} color="var(--brand-primary)" />
          <span>Neighborhood Zone Performance</span>
        </h3>

        <div className="responsive-table-container">
          <table className="civic-table">
            <thead>
              <tr>
                <th>Zone / Sector</th>
                <th>Total Reports</th>
                <th>Resolved Cases</th>
                <th>Resolution Rate</th>
                <th>Service Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(stats.zoneBreakdown).map((zoneName) => {
                const z = stats.zoneBreakdown[zoneName];
                const pct = z.total > 0 ? Math.round((z.resolved / z.total) * 100) : 0;
                return (
                  <tr key={zoneName}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{zoneName}</td>
                    <td>{z.total}</td>
                    <td>{z.resolved}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{pct}%</span>
                        <div
                          style={{
                            width: '80px',
                            height: '6px',
                            backgroundColor: 'var(--bg-surface)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              backgroundColor: pct >= 50 ? '#16a34a' : '#f59e0b',
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>
                        Active Monitoring
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </details>
    </div>
  );
};
