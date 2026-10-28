import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Users, BarChart3, ShieldAlert } from 'lucide-react';

export default function KpiMetrics({ metrics }) {
  const data = metrics || {
    totalRequests: 0,
    allowedRequests: 0,
    blockedRequests: 0,
    bannedRequests: 0,
    rejectionRate: 0,
    activeUsersCount: 0,
    abuseIncidents: 0
  };

  const cards = [
    {
      title: 'Total Traffic',
      value: data.totalRequests,
      subtext: 'Ingressed calls to gateway',
      icon: BarChart3,
      badgeColor: '#000000',
      textColor: '#000000'
    },
    {
      title: 'Allowed (200 OK)',
      value: data.allowedRequests,
      subtext: `${data.totalRequests > 0 ? (100 - data.rejectionRate).toFixed(1) : 100}% within quota`,
      icon: CheckCircle2,
      badgeColor: 'var(--accent-emerald)',
      textColor: 'var(--accent-emerald)'
    },
    {
      title: 'Blocked (429 Throttled)',
      value: data.blockedRequests,
      subtext: `${data.rejectionRate}% rate limit rejects`,
      icon: XCircle,
      badgeColor: 'var(--accent-rose)',
      textColor: 'var(--accent-rose)'
    },
    {
      title: 'Security Bans (403)',
      value: data.bannedRequests,
      subtext: `${data.abuseIncidents} abuse alerts logged`,
      icon: ShieldAlert,
      badgeColor: 'var(--accent-purple)',
      textColor: 'var(--accent-purple)'
    },
    {
      title: 'Active Consumers',
      value: data.activeUsersCount,
      subtext: 'Unique IP & user IDs',
      icon: Users,
      badgeColor: '#000000',
      textColor: '#000000'
    }
  ];

  return (
    <div className="metrics-grid">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div 
            key={idx} 
            className="kpi-card"
          >
            <div className="kpi-header">
              <span className="kpi-title">{card.title}</span>
              <div className="kpi-icon-wrap" style={{ color: card.textColor }}>
                <Icon size={22} />
              </div>
            </div>
            <div className="kpi-value" style={{ color: card.textColor }}>
              {card.value.toLocaleString()}
            </div>
            <div className="kpi-subtext">
              {card.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
}
