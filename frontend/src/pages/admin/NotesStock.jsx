import React, { useState } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { BookMarked, Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

export default function NotesStock() {
  const [stock, setStock] = useState([
    { id: 'NT-101', title: 'Physics Vol. 1: Mechanics & Heat', standard: '11th Science', inStock: 120, reorderLevel: 25, unitCost: 350 },
    { id: 'NT-102', title: 'Physics Vol. 2: Optics & Waves', standard: '12th Science', inStock: 18, reorderLevel: 30, unitCost: 420 },
    { id: 'NT-103', title: 'Chemistry Vol. 1: Organic Foundations', standard: '11th Science', inStock: 85, reorderLevel: 20, unitCost: 380 },
    { id: 'NT-104', title: 'Mathematics: Calculus & Vectors Guide', standard: '12th Science', inStock: 64, reorderLevel: 25, unitCost: 450 },
    { id: 'NT-105', title: 'Biology: Human Physiology Workbook', standard: '12th NEET', inStock: 9, reorderLevel: 20, unitCost: 400 },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', standard: '12th Science', inStock: 50, reorderLevel: 20, unitCost: 400 });

  const handleAddStock = (e) => {
    e.preventDefault();
    const item = {
      ...newBook,
      id: `NT-${Math.floor(100 + Math.random() * 900)}`,
      inStock: Number(newBook.inStock),
      reorderLevel: Number(newBook.reorderLevel),
      unitCost: Number(newBook.unitCost),
    };
    setStock([...stock, item]);
    toast.success(`Book inventory for "${newBook.title}" updated!`);
    setModalOpen(false);
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Notes & Study Material Inventory
          </h3>
          <span className="small text-sa-muted">
            Track printed modules, warehouse stock, and low inventory reorder thresholds
          </span>
        </div>

        <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>
          Add New Book Stock
        </Button>
      </div>

      <div className="sa-card p-4">
        <Table
          columns={[
            { key: 'id', title: 'SKU / Book ID', render: (val) => <span className="fw-bold">{val}</span> },
            {
              key: 'title',
              title: 'Module Title',
              render: (val, row) => (
                <div className="d-flex align-items-center gap-2">
                  <BookMarked size={18} className="text-sa-primary" />
                  <span className="fw-semibold text-sa-charcoal">{val}</span>
                </div>
              )
            },
            { key: 'standard', title: 'Class Stream' },
            {
              key: 'inStock',
              title: 'Current Stock',
              render: (val, row) => (
                <div className="d-flex align-items-center gap-2">
                  <span className={`fw-bold ${val <= row.reorderLevel ? 'text-danger' : 'text-success'}`}>
                    {val} Copies
                  </span>
                  {val <= row.reorderLevel && (
                    <span className="badge bg-danger small d-flex align-items-center gap-1">
                      <AlertTriangle size={12} /> Low
                    </span>
                  )}
                </div>
              )
            },
            { key: 'reorderLevel', title: 'Reorder Level', render: (val) => `${val} Copies` },
            { key: 'unitCost', title: 'Cost per Unit', render: (val) => `₹ ${val}` }
          ]}
          data={stock}
        />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Printed Book Stock">
        <form onSubmit={handleAddStock}>
          <Input
            label="Module / Book Title"
            name="title"
            value={newBook.title}
            onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
            placeholder="e.g. Modern Physics Numerical Guide"
            required
          />
          <Select
            label="Class / Stream"
            name="standard"
            value={newBook.standard}
            onChange={(e) => setNewBook({ ...newBook, standard: e.target.value })}
            options={['12th Science', '11th Science', '12th Commerce', '11th Commerce', '12th NEET']}
          />
          <div className="row g-2">
            <div className="col-6">
              <Input
                label="Quantity Added"
                name="inStock"
                type="number"
                value={newBook.inStock}
                onChange={(e) => setNewBook({ ...newBook, inStock: e.target.value })}
                required
              />
            </div>
            <div className="col-6">
              <Input
                label="Reorder Threshold"
                name="reorderLevel"
                type="number"
                value={newBook.reorderLevel}
                onChange={(e) => setNewBook({ ...newBook, reorderLevel: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Add to Inventory</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
