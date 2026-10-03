import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { BookMarked, Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import inventoryService from '../../services/inventoryService';

export default function NotesStock() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStock = async () => {
    try {
      const data = await inventoryService.getItems();
      setStock(data.map(item => ({
        id: item.id,
        title: item.title,
        standard: item.standard,
        inStock: item.in_stock,
        reorderLevel: item.reorder_level,
        unitCost: item.unit_cost
      })));
    } catch (err) {
      toast.error('Failed to load inventory stock');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', standard: '11th pcm tarabai park', inStock: 50, reorderLevel: 20, unitCost: 400 });

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      await inventoryService.createItem({
        title: newBook.title,
        standard: newBook.standard,
        in_stock: Number(newBook.inStock),
        reorder_level: Number(newBook.reorderLevel),
        unit_cost: Number(newBook.unitCost)
      });
      toast.success(`Book inventory for "${newBook.title}" updated!`);
      setModalOpen(false);
      setNewBook({ title: '', standard: '11th pcm tarabai park', inStock: 50, reorderLevel: 20, unitCost: 400 });
      fetchStock();
    } catch (err) {
      toast.error('Failed to add book stock');
    }
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
          loading={loading}
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
            options={[
              '11th pcm tarabai park',
              '11th pcb tarabai park',
              '11th pcmb tarabai park',
              '12th pcm tarabai park',
              '12th pcb tarabai park',
              '12th pcmb tarabai park',
              '11th pcm Mangalvar peth',
              '11th pcb Mangalvar peth',
              '11th pcmb Mangalvar peth',
              '12th pcm Mangalvar peth',
              '12th pcb Mangalvar peth',
              '12th pcmb Mangalvar peth'
            ]}
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
