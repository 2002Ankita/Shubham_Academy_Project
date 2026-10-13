import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { 
  BookMarked, 
  Plus, 
  AlertTriangle, 
  Search, 
  Package, 
  Sparkles, 
  RefreshCw, 
  PlusCircle, 
  MinusCircle,
  Edit3,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'react-toastify';
import inventoryService from '../../services/inventoryService';

export default function NotesStock() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All'); // All, Theory, CET
  const [subjectFilter, setSubjectFilter] = useState('All');   // All, Physics, Chemistry, Biology, Maths
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [replenishModalOpen, setReplenishModalOpen] = useState(false);
  const [selectedBookForReplenish, setSelectedBookForReplenish] = useState(null);
  const [replenishQty, setReplenishQty] = useState(25);

  // New Book State
  const [newBook, setNewBook] = useState({
    category: 'Theory',
    subject: 'Physics',
    title: 'Theory - Physics',
    standard: '11th & 12th Science',
    inStock: 50,
    reorderLevel: 15,
    unitCost: 350
  });

  // Edit Book State
  const [editingBook, setEditingBook] = useState(null);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getItems();
      setStock((data || []).map(item => ({
        id: item.id,
        title: item.title,
        category: item.category || (item.title.toLowerCase().includes('cet') ? 'CET' : 'Theory'),
        subject: item.subject || 'Physics',
        standard: item.standard || '11th & 12th Science',
        inStock: Number(item.in_stock) || 0,
        reorderLevel: Number(item.reorder_level) || 15,
        unitCost: Number(item.unit_cost) || 350
      })));
    } catch (err) {
      toast.error('Failed to load books and stock inventory from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleCategoryChange = (cat) => {
    setNewBook(prev => {
      const subj = prev.subject || 'Physics';
      return {
        ...prev,
        category: cat,
        title: `${cat} - ${subj}`,
        unitCost: cat === 'CET' ? 400 : 350
      };
    });
  };

  const handleSubjectChange = (subj) => {
    setNewBook(prev => {
      const cat = prev.category || 'Theory';
      return {
        ...prev,
        subject: subj,
        title: `${cat} - ${subj}`
      };
    });
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      await inventoryService.createItem({
        title: newBook.title,
        category: newBook.category,
        subject: newBook.subject,
        standard: newBook.standard,
        in_stock: Number(newBook.inStock),
        reorder_level: Number(newBook.reorderLevel),
        unit_cost: Number(newBook.unitCost)
      });
      toast.success(`Book stock for "${newBook.title}" successfully added!`);
      setModalOpen(false);
      fetchStock();
    } catch (err) {
      toast.error('Failed to add book stock to database');
    }
  };

  const handleOpenEditModal = (row) => {
    setEditingBook({
      id: row.id,
      title: row.title,
      category: row.category,
      subject: row.subject,
      standard: row.standard,
      inStock: row.inStock,
      reorderLevel: row.reorderLevel,
      unitCost: row.unitCost
    });
    setEditModalOpen(true);
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!editingBook) return;
    try {
      await inventoryService.updateItem(editingBook.id, {
        title: editingBook.title,
        category: editingBook.category,
        subject: editingBook.subject,
        standard: editingBook.standard,
        in_stock: Number(editingBook.inStock),
        reorder_level: Number(editingBook.reorderLevel),
        unit_cost: Number(editingBook.unitCost)
      });
      toast.success(`Book stock for "${editingBook.title}" updated successfully!`);
      setEditModalOpen(false);
      setEditingBook(null);
      fetchStock();
    } catch (err) {
      toast.error('Failed to update book stock');
    }
  };

  const handleDeleteStock = async (bookId, bookTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${bookTitle}" from inventory?`)) {
      return;
    }
    try {
      await inventoryService.deleteItem(bookId);
      toast.success(`Book "${bookTitle}" removed from inventory.`);
      setStock(prev => prev.filter(b => b.id !== bookId));
      fetchStock();
    } catch (err) {
      toast.error('Failed to delete book stock');
    }
  };

  const handleQuickAdjust = async (bookId, delta, bookTitle) => {
    try {
      await inventoryService.adjustStock(bookId, delta);
      toast.success(`${delta > 0 ? `+${delta}` : delta} copies updated for ${bookTitle}!`);
      fetchStock();
    } catch (err) {
      toast.error('Failed to adjust stock');
    }
  };

  const handleConfirmReplenish = async (e) => {
    e.preventDefault();
    if (!selectedBookForReplenish) return;
    try {
      await inventoryService.adjustStock(selectedBookForReplenish.id, Number(replenishQty));
      toast.success(`Successfully added ${replenishQty} copies to "${selectedBookForReplenish.title}"!`);
      setReplenishModalOpen(false);
      setSelectedBookForReplenish(null);
      fetchStock();
    } catch (err) {
      toast.error('Failed to replenish stock');
    }
  };

  // KPI Calculations
  const totalCopies = stock.reduce((acc, it) => acc + it.inStock, 0);
  const theoryCopies = stock.filter(it => it.category === 'Theory').reduce((acc, it) => acc + it.inStock, 0);
  const cetCopies = stock.filter(it => it.category === 'CET').reduce((acc, it) => acc + it.inStock, 0);
  const lowStockCount = stock.filter(it => it.inStock <= it.reorderLevel).length;

  // Filtered list
  const filteredStock = stock.filter(item => {
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesSubject = subjectFilter === 'All' || item.subject.toLowerCase() === subjectFilter.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || 
      item.title.toLowerCase().includes(q) || 
      item.subject.toLowerCase().includes(q) || 
      item.standard.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q);

    return matchesCategory && matchesSubject && matchesQuery;
  });

  return (
    <div className="d-flex flex-column gap-4 pb-4">
      {/* 1. Header Banner */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4 d-flex align-items-center gap-2">
            <BookMarked className="text-sa-primary" size={24} />
            <span>Books & Stock Inventory</span>
          </h3>
          <span className="small text-sa-muted">
            Live warehouse stock records, copies on hand, and reorder levels for Theory and CET books
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button variant="outline" icon={RefreshCw} onClick={fetchStock}>
            Refresh
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>
            Add New Book Stock
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 d-flex align-items-center justify-content-between h-100 bg-white border">
            <div>
              <span className="text-sa-muted fw-semibold small d-block">Total Books in Stock</span>
              <div className="fw-bold brand-font text-sa-charcoal fs-3">{totalCopies}</div>
              <span className="small text-success fw-medium">Live database count</span>
            </div>
            <div className="rounded-circle p-2.5 bg-primary bg-opacity-10 text-primary">
              <Package size={24} />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 d-flex align-items-center justify-content-between h-100 bg-white border">
            <div>
              <span className="text-sa-muted fw-semibold small d-block">Theory Books Available</span>
              <div className="fw-bold brand-font fs-3" style={{ color: '#8B1216' }}>{theoryCopies}</div>
              <span className="small text-sa-muted">Physics, Chem, Bio, Maths</span>
            </div>
            <div className="rounded-circle p-2.5 text-danger bg-danger bg-opacity-10">
              <BookMarked size={24} />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 d-flex align-items-center justify-content-between h-100 bg-white border">
            <div>
              <span className="text-sa-muted fw-semibold small d-block">CET Books Available</span>
              <div className="fw-bold brand-font fs-3 text-warning-emphasis">{cetCopies}</div>
              <span className="small text-sa-muted">Physics, Chem, Bio, Maths</span>
            </div>
            <div className="rounded-circle p-2.5 bg-warning bg-opacity-10 text-warning-emphasis">
              <Sparkles size={24} />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 d-flex align-items-center justify-content-between h-100 bg-white border">
            <div>
              <span className="text-sa-muted fw-semibold small d-block">Low Stock Warnings</span>
              <div className="fw-bold brand-font fs-3 text-danger">{lowStockCount}</div>
              <span className="small text-danger fw-medium">Below reorder threshold</span>
            </div>
            <div className="rounded-circle p-2.5 bg-danger bg-opacity-10 text-danger">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filters & Search Toolbar */}
      <div className="sa-card p-3 bg-white border">
        <div className="row g-2 align-items-center">
          {/* Search */}
          <div className="col-12 col-md-5 position-relative">
            <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-sa-muted" />
            <input
              type="text"
              className="form-control ps-5 py-2 text-sm"
              placeholder="Search by book name, subject, standard, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Tabs */}
          <div className="col-12 col-md-4 d-flex gap-1">
            {['All', 'Theory', 'CET'].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`btn btn-sm flex-grow-1 py-1.5 fw-semibold rounded-2 ${
                  categoryFilter === cat ? 'btn-danger text-white' : 'btn-light border text-sa-charcoal'
                }`}
                style={categoryFilter === cat ? { backgroundColor: '#8B1216', borderColor: '#8B1216' } : {}}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === 'All' ? 'All Books' : `${cat} Books`}
              </button>
            ))}
          </div>

          {/* Subject Filter Dropdown */}
          <div className="col-12 col-md-3">
            <select
              className="form-select form-select-sm py-2 shadow-xs fw-medium"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="All">All Subjects</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Maths">Maths</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Books Stock Table */}
      <div className="sa-card p-4 bg-white border">
        <Table
          columns={[
            {
              key: 'category',
              title: 'Book Type',
              width: '120px',
              render: (val, row) => (
                <span
                  className="badge px-2.5 py-1 fw-bold rounded-pill text-uppercase"
                  style={{
                    fontSize: '0.72rem',
                    backgroundColor: val === 'CET' ? '#FEF3C7' : '#FEE2E2',
                    color: val === 'CET' ? '#92400E' : '#991B1B',
                    border: val === 'CET' ? '1px solid #FCD34D' : '1px solid #FCA5A5'
                  }}
                >
                  {val || (row.title.toLowerCase().includes('cet') ? 'CET' : 'Theory')}
                </span>
              )
            },
            {
              key: 'subject',
              title: 'Subject',
              width: '130px',
              render: (val) => (
                <span className="fw-semibold text-sa-charcoal">{val || 'Physics'}</span>
              )
            },
            {
              key: 'title',
              title: 'Module / Book Title',
              render: (val, row) => (
                <div className="d-flex align-items-center gap-2">
                  <BookMarked size={17} className="text-sa-primary flex-shrink-0" />
                  <div>
                    <span className="fw-bold text-sa-charcoal d-block">{val}</span>
                    <span className="text-sa-muted small">SKU: {row.id.substring(row.id.length - 8)}</span>
                  </div>
                </div>
              )
            },
            {
              key: 'standard',
              title: 'Class / Stream',
              width: '160px',
              render: (val) => <span className="text-sa-muted small">{val}</span>
            },
            {
              key: 'inStock',
              title: 'Available Stock',
              width: '160px',
              render: (val, row) => {
                const isLow = val <= row.reorderLevel;
                return (
                  <div className="d-flex align-items-center gap-2">
                    <span className={`fw-extrabold brand-font fs-6 ${isLow ? 'text-danger' : 'text-success'}`}>
                      {val} Copies
                    </span>
                    {isLow && (
                      <span className="badge bg-danger small d-flex align-items-center gap-1">
                        <AlertTriangle size={11} /> Low Stock
                      </span>
                    )}
                  </div>
                );
              }
            },
            {
              key: 'reorderLevel',
              title: 'Reorder Threshold',
              width: '130px',
              render: (val) => <span className="text-sa-muted">{val} Copies</span>
            },
            {
              key: 'unitCost',
              title: 'Unit Cost',
              width: '110px',
              render: (val) => <span className="fw-semibold text-sa-charcoal">₹{val}</span>
            },
            {
              key: 'actions',
              title: 'Stock Actions',
              align: 'end',
              width: '210px',
              render: (_, row) => (
                <div className="d-flex align-items-center justify-content-end gap-1.5">
                  <button
                    type="button"
                    title="Quick reduce stock (-1)"
                    className="btn btn-sm btn-light border p-1 text-danger"
                    onClick={() => handleQuickAdjust(row.id, -1, row.title)}
                    disabled={row.inStock <= 0}
                  >
                    <MinusCircle size={15} />
                  </button>
                  <button
                    type="button"
                    title="Quick add stock (+1)"
                    className="btn btn-sm btn-light border p-1 text-success"
                    onClick={() => handleQuickAdjust(row.id, 1, row.title)}
                  >
                    <PlusCircle size={15} />
                  </button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedBookForReplenish(row);
                      setReplenishQty(25);
                      setReplenishModalOpen(true);
                    }}
                  >
                    + Restock
                  </Button>
                  <button
                    type="button"
                    title="Edit book stock"
                    className="btn btn-sm btn-light border p-1 text-primary"
                    onClick={() => handleOpenEditModal(row)}
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    type="button"
                    title="Delete book"
                    className="btn btn-sm btn-light border p-1 text-danger"
                    onClick={() => handleDeleteStock(row.id, row.title)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            }
          ]}
          data={filteredStock}
          loading={loading}
          emptyText="No books found in database."
        />
      </div>

      {/* 5. Modal: Add New Book Stock */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Printed Book Stock">
        <form onSubmit={handleAddStock} className="d-flex flex-column gap-3">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label small fw-bold">Book Type</label>
              <select
                className="form-select"
                value={newBook.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                required
              >
                <option value="Theory">Theory Book</option>
                <option value="CET">CET Book</option>
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label small fw-bold">Subject</label>
              <select
                className="form-select"
                value={newBook.subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                required
              >
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Maths">Maths</option>
                <option value="Biology">Biology</option>
              </select>
            </div>
          </div>

          <Input
            label="Module / Book Title"
            name="title"
            value={newBook.title}
            onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
            placeholder="e.g. Theory - Physics"
            required
          />

          <Select
            label="Target Class Stream"
            name="standard"
            value={newBook.standard}
            onChange={(e) => setNewBook({ ...newBook, standard: e.target.value })}
            options={[
              '11th & 12th Science',
              '11th pcm tarabai park',
              '11th pcb tarabai park',
              '11th pcmb tarabai park',
              '12th pcm tarabai park',
              '12th pcb tarabai park',
              '12th pcmb tarabai park',
              '11th pcm Mangalvar peth',
              '11th pcb Mangalvar peth',
              '12th pcm Mangalvar peth'
            ]}
          />

          <div className="row g-3">
            <div className="col-4">
              <Input
                label="Copies Added"
                name="inStock"
                type="number"
                value={newBook.inStock}
                onChange={(e) => setNewBook({ ...newBook, inStock: e.target.value })}
                required
                min="1"
              />
            </div>
            <div className="col-4">
              <Input
                label="Reorder Threshold"
                name="reorderLevel"
                type="number"
                value={newBook.reorderLevel}
                onChange={(e) => setNewBook({ ...newBook, reorderLevel: e.target.value })}
                required
                min="1"
              />
            </div>
            <div className="col-4">
              <Input
                label="Cost per Unit (₹)"
                name="unitCost"
                type="number"
                value={newBook.unitCost}
                onChange={(e) => setNewBook({ ...newBook, unitCost: e.target.value })}
                required
                min="0"
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Add to Inventory</Button>
          </div>
        </form>
      </Modal>

      {/* 6. Modal: Edit Book Stock */}
      {editModalOpen && editingBook && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Edit Book Stock: ${editingBook.title}`}
        >
          <form onSubmit={handleUpdateStock} className="d-flex flex-column gap-3">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold">Book Type</label>
                <select
                  className="form-select"
                  value={editingBook.category}
                  onChange={(e) => setEditingBook({ ...editingBook, category: e.target.value })}
                  required
                >
                  <option value="Theory">Theory Book</option>
                  <option value="CET">CET Book</option>
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold">Subject</label>
                <select
                  className="form-select"
                  value={editingBook.subject}
                  onChange={(e) => setEditingBook({ ...editingBook, subject: e.target.value })}
                  required
                >
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Maths">Maths</option>
                  <option value="Biology">Biology</option>
                </select>
              </div>
            </div>

            <Input
              label="Module / Book Title"
              name="title"
              value={editingBook.title}
              onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
              required
            />

            <Select
              label="Target Class Stream"
              name="standard"
              value={editingBook.standard}
              onChange={(e) => setEditingBook({ ...editingBook, standard: e.target.value })}
              options={[
                '11th & 12th Science',
                '11th pcm tarabai park',
                '11th pcb tarabai park',
                '11th pcmb tarabai park',
                '12th pcm tarabai park',
                '12th pcb tarabai park',
                '12th pcmb tarabai park',
                '11th pcm Mangalvar peth',
                '11th pcb Mangalvar peth',
                '12th pcm Mangalvar peth'
              ]}
            />

            <div className="row g-3">
              <div className="col-4">
                <Input
                  label="Available Copies"
                  name="inStock"
                  type="number"
                  value={editingBook.inStock}
                  onChange={(e) => setEditingBook({ ...editingBook, inStock: e.target.value })}
                  required
                  min="0"
                />
              </div>
              <div className="col-4">
                <Input
                  label="Reorder Threshold"
                  name="reorderLevel"
                  type="number"
                  value={editingBook.reorderLevel}
                  onChange={(e) => setEditingBook({ ...editingBook, reorderLevel: e.target.value })}
                  required
                  min="1"
                />
              </div>
              <div className="col-4">
                <Input
                  label="Unit Cost (₹)"
                  name="unitCost"
                  type="number"
                  value={editingBook.unitCost}
                  onChange={(e) => setEditingBook({ ...editingBook, unitCost: e.target.value })}
                  required
                  min="0"
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <Button variant="light" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" icon={CheckCircle2}>Update Book Stock</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 7. Modal: Restock Existing Book */}
      {selectedBookForReplenish && (
        <Modal
          isOpen={replenishModalOpen}
          onClose={() => setReplenishModalOpen(false)}
          title={`Restock Copies: ${selectedBookForReplenish.title}`}
        >
          <form onSubmit={handleConfirmReplenish} className="d-flex flex-column gap-3">
            <div className="p-3 bg-light rounded-2 border">
              <div className="small text-sa-muted">Current Available Stock</div>
              <div className="fw-bold fs-4 text-sa-charcoal">{selectedBookForReplenish.inStock} Copies</div>
              <div className="small text-secondary mt-1">
                Type: <strong>{selectedBookForReplenish.category}</strong> | Subject: <strong>{selectedBookForReplenish.subject}</strong>
              </div>
            </div>

            <div>
              <label className="form-label small fw-bold">Copies to Add to Warehouse</label>
              <div className="input-group">
                <input
                  type="number"
                  className="form-control form-control-lg fw-bold brand-font"
                  value={replenishQty}
                  onChange={(e) => setReplenishQty(e.target.value)}
                  min="1"
                  required
                />
                <span className="input-group-text">Copies</span>
              </div>
              <div className="d-flex gap-2 mt-2">
                {[10, 25, 50, 100].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    className="btn btn-sm btn-outline-secondary flex-grow-1"
                    onClick={() => setReplenishQty(amt)}
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <Button variant="light" onClick={() => setReplenishModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Confirm Stock Addition</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
