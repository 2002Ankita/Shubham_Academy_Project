import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import salaryService from '../../services/salaryService';
import { CreditCard, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

export default function TeacherSalary() {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const data = await salaryService.getAll();
      setSalaries(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, []);

  const handleDisburse = async (id, name) => {
    await salaryService.disburseSalary(id);
    toast.success(`Salary disbursed to ${name} via NEFT!`);
    fetchSalaries();
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
          Faculty Salary & Payroll Register
        </h3>
        <span className="small text-sa-muted">
          Manage teacher monthly compensation, allowances, deductions, and bank wire transfers
        </span>
      </div>

      <div className="sa-card p-4">
        <Table
          columns={[
            { key: 'month', title: 'Salary Month', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'teacherName', title: 'Faculty' },
            { key: 'subject', title: 'Subject' },
            { key: 'baseSalary', title: 'Base (₹)', render: (val) => `₹ ${val?.toLocaleString()}` },
            { key: 'allowances', title: 'Allowances', render: (val) => `+₹ ${val?.toLocaleString()}` },
            { key: 'deductions', title: 'Deductions', render: (val) => `-₹ ${val?.toLocaleString()}` },
            {
              key: 'netPayable',
              title: 'Net Payable',
              render: (val) => <span className="fw-bold text-sa-primary">₹ {val?.toLocaleString()}</span>
            },
            {
              key: 'status',
              title: 'Payment Status',
              render: (val, row) => (
                <div>
                  <span className={val === 'Disbursed' ? 'badge-paid' : 'badge-pending'}>
                    {val}
                  </span>
                  {row.transactionRef !== '--' && (
                    <span className="text-xs text-sa-muted d-block mt-1" style={{ fontSize: '0.72rem' }}>
                      {row.transactionRef}
                    </span>
                  )}
                </div>
              )
            },
            {
              key: 'id',
              title: 'Action',
              align: 'end',
              render: (val, row) => (
                row.status === 'Processing' ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleDisburse(val, row.teacherName)}
                  >
                    Disburse NEFT
                  </Button>
                ) : (
                  <span className="small text-success fw-bold d-flex align-items-center justify-content-end gap-1">
                    <CheckCircle size={14} /> Paid
                  </span>
                )
              )
            }
          ]}
          data={salaries}
          loading={loading}
        />
      </div>
    </div>
  );
}
