import React from 'react';
import Loader from './Loader';

export default function Table({
  columns = [], // [{ key, title, render?: (val, row) => node, align?: 'left'|'center'|'right' }]
  data = [],
  loading = false,
  emptyMessage = 'No records found',
  className = '',
}) {
  return (
    <div className={`sa-table-wrapper ${className}`}>
      <div className="table-responsive">
        <table className="sa-table table mb-0">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  className={`text-${col.align || 'start'}`}
                  style={col.width ? { width: col.width } : {}}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-5">
                  <Loader message="Fetching data..." />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-5 text-sa-muted">
                  <div className="py-3">
                    <p className="mb-0 fw-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={row.id || rowIdx}>
                  {columns.map((col, colIdx) => (
                    <td key={col.key || colIdx} className={`text-${col.align || 'start'}`}>
                      {col.render ? col.render(row[col.key], row, rowIdx) : (row[col.key] ?? '--')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
