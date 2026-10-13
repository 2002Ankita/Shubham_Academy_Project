import React from 'react';
import Loader from './Loader';

export default function Table({
  columns = [], // [{ key, title, render?: (val, row) => node, align?: 'left'|'center'|'right', width, minWidth, wrapHeader, headerStyle, cellStyle }]
  data = [],
  loading = false,
  emptyMessage = 'No records found',
  className = '',
}) {
  return (
    <div className={`sa-table-wrapper ${className}`}>
      <div className="table-responsive">
        <table className="sa-table table mb-0 align-middle">
          <thead>
            <tr>
              {columns.map((col, idx) => {
                const headerStyle = {
                  ...(col.width ? { width: col.width, minWidth: col.width } : {}),
                  ...(col.minWidth ? { minWidth: col.minWidth } : {}),
                  whiteSpace: col.wrapHeader ? 'normal' : 'nowrap',
                  verticalAlign: 'middle',
                  ...(col.headerStyle || {})
                };
                return (
                  <th
                    key={col.key || idx}
                    className={`text-${col.align || 'start'} ${col.headerClassName || ''}`}
                    style={headerStyle}
                  >
                    {col.title}
                  </th>
                );
              })}
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
                  {columns.map((col, colIdx) => {
                    const cellStyle = {
                      ...(col.width ? { width: col.width, minWidth: col.width } : {}),
                      ...(col.minWidth ? { minWidth: col.minWidth } : {}),
                      verticalAlign: 'middle',
                      ...(col.cellStyle || {})
                    };
                    return (
                      <td
                        key={col.key || colIdx}
                        className={`text-${col.align || 'start'} ${col.cellClassName || ''}`}
                        style={cellStyle}
                      >
                        {col.render ? col.render(row[col.key], row, rowIdx) : (row[col.key] ?? '--')}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
