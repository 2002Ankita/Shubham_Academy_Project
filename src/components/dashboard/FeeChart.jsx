import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export default function FeeChart({
  data = [
    { month: 'Apr', Collected: 21, Pending: 4 },
    { month: 'May', Collected: 28, Pending: 5.5 },
    { month: 'Jun', Collected: 36, Pending: 6.2 },
    { month: 'Jul', Collected: 29, Pending: 7 },
    { month: 'Aug', Collected: 24, Pending: 5.1 },
    { month: 'Sep', Collected: 14, Pending: 5.2 },
  ],
  title = 'Fee Collections vs Overdue (in Lakhs ₹)',
}) {
  return (
    <div className="sa-card p-4 h-100">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="brand-font fw-bold m-0 text-sa-charcoal fs-6">{title}</h5>
          <span className="small text-sa-muted">Cash, UPI & Bank Wire Realization</span>
        </div>
      </div>

      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="feeCollected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stop-color="#168554" stop-opacity={0.3} />
                <stop offset="95%" stop-color="#168554" stop-opacity={0} />
              </linearGradient>
              <linearGradient id="feePending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stop-color="#D97718" stop-opacity={0.3} />
                <stop offset="95%" stop-color="#D97718" stop-opacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe1" />
            <XAxis dataKey="month" stroke="#737373" fontSize={12} tickLine={false} />
            <YAxis stroke="#737373" fontSize={12} tickLine={false} />
            <Tooltip
              formatter={(val) => `₹ ${val} Lakhs`}
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#E7E2DA',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: '12px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Area
              type="monotone"
              dataKey="Collected"
              stroke="#168554"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#feeCollected)"
            />
            <Area
              type="monotone"
              dataKey="Pending"
              stroke="#D97718"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#feePending)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
