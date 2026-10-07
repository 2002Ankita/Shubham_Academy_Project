import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import salaryService from '../../services/salaryService';
import { CreditCard, CheckCircle, Clock, Edit2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function TeacherSalary() {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [editForm, setEditForm] = useState({ baseSalary: 0, allowances: 0, deductions: 0, netPayable: 0 });
  const [generating, setGenerating] = useState(false);
  const [disburseModalOpen, setDisburseModalOpen] = useState(false);
  const [disburseForm, setDisburseForm] = useState({ id: null, name: '', amount: 0, maxAmount: 0 });

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

  const handleDisburseClick = (row) => {
    setDisburseForm({
      id: row.id,
      name: row.teacherName,
      amount: '',
      maxAmount: row.amountPending || row.netPayable
    });
    setDisburseModalOpen(true);
  };

  const submitDisburse = async (e) => {
    e.preventDefault();
    try {
      await salaryService.disburseSalary(disburseForm.id, Number(disburseForm.amount));
      toast.success(`Payment of ₹${disburseForm.amount} disbursed to ${disburseForm.name}!`);
      setDisburseModalOpen(false);
      fetchSalaries();
    } catch (err) {
      toast.error('Failed to disburse salary.');
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      await salaryService.generateDrafts(currentMonth);
      toast.success(`Generated salary drafts for ${currentMonth}`);
      fetchSalaries();
    } catch (err) {
      toast.error('Failed to generate drafts.');
    } finally {
      setGenerating(false);
    }
  };

  const handleEditClick = (row) => {
    setSelectedRow(row);
    setEditForm({ 
      baseSalary: row.baseSalary, 
      allowances: row.allowances, 
      deductions: row.deductions,
      netPayable: row.netPayable 
    });
    setEditModalOpen(true);
  };

  // Auto calculate net payable when base, allowances or deductions change
  useEffect(() => {
    if (editModalOpen) {
      const net = Number(editForm.baseSalary) + Number(editForm.allowances) - Number(editForm.deductions);
      setEditForm(prev => ({ ...prev, netPayable: net }));
    }
  }, [editForm.baseSalary, editForm.allowances, editForm.deductions]);

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedRow) return;
    try {
      await salaryService.updateSalary(
        selectedRow.id, 
        Number(editForm.baseSalary), 
        Number(editForm.allowances), 
        Number(editForm.deductions),
        Number(editForm.netPayable)
      );
      toast.success('Salary updated successfully');
      setEditModalOpen(false);
      fetchSalaries();
    } catch (err) {
      toast.error('Failed to update salary');
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Faculty Salary & Payroll Register
          </h3>
          <span className="small text-sa-muted">
            Manage teacher monthly compensation, allowances, deductions, and bank wire transfers
          </span>
        </div>
        <Button 
          variant="primary" 
          onClick={handleGenerate} 
          disabled={generating}
        >
          {generating ? 'Generating...' : 'Generate Current Month Drafts'}
        </Button>
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
              title: 'Net / Pending',
              render: (val, row) => (
                <div>
                  <span className="fw-bold text-sa-primary d-block">₹ {val?.toLocaleString()}</span>
                  <span className="text-muted" style={{ fontSize: '11px' }}>Pending: ₹ {row.amountPending?.toLocaleString() || 0}</span>
                </div>
              )
            },
            {
              key: 'status',
              title: 'Payment Status',
              render: (val, row) => (
                <div>
                  <span className={val === 'Disbursed' ? 'badge-paid' : val === 'Partially Paid' ? 'badge text-bg-warning text-dark' : 'badge-pending'}>
                    {val === 'Disbursed' ? 'Fully Paid' : val}
                  </span>
                  {row.installments && row.installments.length > 0 && (
                    <div className="mt-2" style={{ fontSize: '0.72rem', minWidth: '120px' }}>
                      <div className="text-muted mb-1 text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>History:</div>
                      {row.installments.map((inst, i) => (
                        <div key={i} className="d-flex justify-content-between border-bottom pb-1 mb-1">
                          <span className="text-muted">Inst {i + 1}:</span>
                          <span className="text-success fw-bold">+₹{inst.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'id',
              title: 'Action',
              align: 'end',
              render: (val, row) => (
                ['Processing', 'Partially Paid'].includes(row.status) ? (
                  <div className="d-flex gap-2 justify-content-end">
                    <Button
                      size="sm"
                      variant="outline"
                      icon={Edit2}
                      onClick={() => handleEditClick(row)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleDisburseClick(row)}
                    >
                      Pay Installment
                    </Button>
                  </div>
                ) : (
                  <span className="small text-success fw-bold d-flex align-items-center justify-content-end gap-1">
                    <CheckCircle size={14} /> Fully Paid
                  </span>
                )
              )
            }
          ]}
          data={salaries}
          loading={loading}
        />
      </div>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Salary: ${selectedRow?.teacherName}`}>
        <form onSubmit={handleSaveEdit}>
          <div className="mb-3">
            <Input
              label="Base Salary (₹) *"
              type="number"
              value={editForm.baseSalary}
              onChange={(e) => {
                const val = e.target.value;
                setEditForm(prev => ({ ...prev, baseSalary: val }));
              }}
              required
            />
          </div>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <Input
                label="Allowances (₹) *"
                type="number"
                value={editForm.allowances}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditForm(prev => ({ ...prev, allowances: val }));
                }}
                required
              />
            </div>
            <div className="col-12 col-md-6">
              <Input
                label="Deductions (₹) *"
                type="number"
                value={editForm.deductions}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditForm(prev => ({ ...prev, deductions: val }));
                }}
                required
              />
            </div>
          </div>
          <div className="mb-3 mt-3">
            <Input
              label="Net Payable (₹) *"
              type="number"
              value={editForm.netPayable}
              onChange={(e) => {
                const val = e.target.value;
                setEditForm(prev => ({ ...prev, netPayable: val }));
              }}
              required
            />
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" type="button" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Changes</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={disburseModalOpen} onClose={() => setDisburseModalOpen(false)} title={`Disburse Payment: ${disburseForm.name}`}>
        <form onSubmit={submitDisburse}>
          <div className="mb-3">
            <Input
              label={`Installment Amount (Max: ₹${disburseForm.maxAmount}) *`}
              type="number"
              placeholder="Enter amount to pay..."
              value={disburseForm.amount}
              onChange={(e) => setDisburseForm(prev => ({ ...prev, amount: e.target.value }))}
              max={disburseForm.maxAmount}
              min={1}
              required
            />
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" type="button" onClick={() => setDisburseModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Confirm Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
