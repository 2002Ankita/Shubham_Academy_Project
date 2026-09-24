import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export default function AttendanceChart({
  data = [
    { day: 'Mon', Present: 450, Absent: 30 },
    { day: 'Tue', Present: 458, Absent: 22 },
    { day: 'Wed', Present: 435, Absent: 45 },
    { day: 'Thu', Present: 462, Absent: 18 },
    { day: 'Fri', Present: 442, Absent: 38 },
    { day: 'Sat', Present: 420, Absent: 60 },
  ],
  title = 'Weekly Attendance Distribution',
}) {
  return (
    <div className="sa-card p-4 h-100">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="brand-font fw-bold m-0 text-sa-charcoal fs-6">{title}</h5>
          <span className="small text-sa-muted">RFID Gate Sensor Data (Daily Aggregates)</span>
        </div>
      </div>

      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe1" />
            <XAxis dataKey="day" stroke="#737373" fontSize={12} tickLine={false} />
            <YAxis stroke="#737373" fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#E7E2DA',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: '12px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="Present" fill="#168554" radius={[4, 4, 0, 0]} maxBarSize={36} />
            <Bar dataKey="Absent" fill="#A91F1F" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
