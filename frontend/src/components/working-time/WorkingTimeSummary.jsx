import React from 'react';
import { Clock, Calendar, CheckCircle2, Target } from 'lucide-react';

export default function WorkingTimeSummary({ summary }) {
  const cards = [
    {
      title: "Today's Hours",
      value: summary.todayHours,
      subtext: "Active logged today",
      icon: Clock,
      color: "#A91D22",
      bgColor: "#FDF0F0"
    },
    {
      title: "Weekly Hours",
      value: summary.thisWeek,
      subtext: "↗ On track this week",
      icon: Calendar,
      color: "#168554",
      bgColor: "#EAF6EF",
      subtextColor: "#168554"
    },
    {
      title: "Monthly Hours",
      value: summary.thisMonth,
      subtext: `${summary.percentage}% of monthly target`,
      icon: CheckCircle2,
      color: "#D97718",
      bgColor: "#FEF8EB"
    },
    {
      title: "Target Hours",
      value: summary.monthlyTarget,
      subtext: "Monthly contract quota",
      icon: Target,
      color: "#0284C7",
      bgColor: "#F0F9FF"
    }
  ];

  return (
    <>
      <style>{`
        .working-time-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        @media (max-width: 991px) {
          .working-time-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 575px) {
          .working-time-kpi-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="working-time-kpi-grid">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="sa-card bg-white rounded-3 border d-flex align-items-center gap-3 transition-all"
              style={{
                height: '88px',
                padding: '14px 16px',
                borderColor: '#E1E6ED',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: '42px',
                  height: '42px',
                  backgroundColor: card.bgColor,
                  color: card.color
                }}
              >
                <Icon size={21} />
              </div>
              <div className="flex-grow-1 min-w-0">
                <span className="text-sa-muted fw-medium d-block text-truncate" style={{ fontSize: '12px' }}>
                  {card.title}
                </span>
                <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                  {card.value}
                </div>
                <span
                  className="d-block text-truncate"
                  style={{
                    fontSize: '10.5px',
                    color: card.subtextColor || 'var(--sa-muted)',
                    fontWeight: card.subtextColor ? 600 : 400
                  }}
                >
                  {card.subtext}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
