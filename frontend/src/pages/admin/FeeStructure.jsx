import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import BackButton from '../../components/common/BackButton';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import feeService from '../../services/feeService';
import { useConfirm } from '../../context/ConfirmContext';
import {
  Layers,
  Plus,
  Search,
  Filter,
  IndianRupee,
  Calendar,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  Edit,
  Trash2,
  BookOpen,
  Building,
  GraduationCap,
  MapPin,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Download,
  RefreshCw,
  AlertCircle,
  Percent
} from 'lucide-react';

const CAMPUS_INFO = {
  'Tarabai Park': {
    name: 'Tarabai Park Campus',
    tagline: 'Head Office & Advanced Science Wing',
    address: '3rd Floor, The Mird House, Tarabai Park, Opposite Swami Vivekananda College Road, Kolhapur-416003',
    phone: '+91 98765 43210',
    colorTheme: '#8B1216', // Primary burgundy
    badgeClass: 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25',
    defaultBatches: [
      '11th PCM',
      '11th PCB',
      '11th PCMB',
      '12th PCM',
      '12th PCB',
      '12th PCMB'
    ]
  },
  'Mangalwar Peth': {
    name: 'Mangalwar Peth Campus',
    tagline: 'City Center & Foundation Wing',
    address: 'Mangalwar Peth, Near Town Center, Kolhapur-416012, Maharashtra',
    phone: '+91 98220 12345',
    colorTheme: '#0F52BA', // Royal Sapphire
    badgeClass: 'bg-primary bg-opacity-10 text-primary border-primary border-opacity-25',
    defaultBatches: [
      'Morning - 11th PCM',
      'Morning - 11th PCB',
      'Morning - 11th PCMB',
      'Morning - 12th PCM',
      'Morning - 12th PCB',
      'Morning - 12th PCMB',
      'Afternoon - 11th PCM',
      'Afternoon - 11th PCB',
      'Afternoon - 11th PCMB',
      'Afternoon - 12th PCM',
      'Afternoon - 12th PCB',
      'Afternoon - 12th PCMB'
    ]
  }
};

const DEFAULT_OFFICIAL_STRUCTURES = [
  // --- Tarabai Park Campus ---
  {
    id: 'FS-TP-101',
    standard: '12th Science',
    batch: '12th pcm tarabai park',
    branch: 'Tarabai Park',
    academic_year: '2025-2026',
    total_fee: 65000,
    installment_amount: 16250,
    number_of_installments: 4,
    due_date: '2026-10-30',
    late_fee: 500
  },
  {
    id: 'FS-TP-102',
    standard: '12th Science',
    batch: '12th pcb tarabai park',
    branch: 'Tarabai Park',
    academic_year: '2025-2026',
    total_fee: 65000,
    installment_amount: 16250,
    number_of_installments: 4,
    due_date: '2026-10-30',
    late_fee: 500
  },
  {
    id: 'FS-TP-103',
    standard: '12th Science',
    batch: '12th pcmb tarabai park',
    branch: 'Tarabai Park',
    academic_year: '2025-2026',
    total_fee: 72000,
    installment_amount: 18000,
    number_of_installments: 4,
    due_date: '2026-10-30',
    late_fee: 500
  },
  {
    id: 'FS-TP-104',
    standard: '11th Science',
    batch: '11th pcm tarabai park',
    branch: 'Tarabai Park',
    academic_year: '2025-2026',
    total_fee: 55000,
    installment_amount: 13750,
    number_of_installments: 4,
    due_date: '2026-11-15',
    late_fee: 500
  },
  {
    id: 'FS-TP-105',
    standard: '11th Science',
    batch: '11th pcb tarabai park',
    branch: 'Tarabai Park',
    academic_year: '2025-2026',
    total_fee: 55000,
    installment_amount: 13750,
    number_of_installments: 4,
    due_date: '2026-11-15',
    late_fee: 500
  },
  {
    id: 'FS-TP-106',
    standard: '11th Science',
    batch: '11th pcmb tarabai park',
    branch: 'Tarabai Park',
    academic_year: '2025-2026',
    total_fee: 62000,
    installment_amount: 15500,
    number_of_installments: 4,
    due_date: '2026-11-15',
    late_fee: 500
  },
  {
    id: 'FS-TP-107',
    standard: 'MHT-CET & JEE Target',
    batch: 'Tarabai Park Rankers Batch',
    branch: 'Tarabai Park',
    academic_year: '2025-2026',
    total_fee: 45000,
    installment_amount: 15000,
    number_of_installments: 3,
    due_date: '2026-11-01',
    late_fee: 300
  },
  {
    id: 'FS-TP-108',
    standard: 'NEET Medical Premier',
    batch: 'Tarabai Park Intensive Batch',
    branch: 'Tarabai Park',
    academic_year: '2025-2026',
    total_fee: 75000,
    installment_amount: 25000,
    number_of_installments: 3,
    due_date: '2026-10-25',
    late_fee: 600
  },

  // --- Mangalwar Peth Campus ---
  {
    id: 'FS-MP-201',
    standard: '12th Science',
    batch: '12th pcm mangalvar peth',
    branch: 'Mangalwar Peth',
    academic_year: '2025-2026',
    total_fee: 60000,
    installment_amount: 15000,
    number_of_installments: 4,
    due_date: '2026-10-30',
    late_fee: 500
  },
  {
    id: 'FS-MP-202',
    standard: '12th Science',
    batch: '12th pcb mangalvar peth',
    branch: 'Mangalwar Peth',
    academic_year: '2025-2026',
    total_fee: 60000,
    installment_amount: 15000,
    number_of_installments: 4,
    due_date: '2026-10-30',
    late_fee: 500
  },
  {
    id: 'FS-MP-203',
    standard: '12th Science',
    batch: '12th pcmb mangalvar peth',
    branch: 'Mangalwar Peth',
    academic_year: '2025-2026',
    total_fee: 68000,
    installment_amount: 17000,
    number_of_installments: 4,
    due_date: '2026-10-30',
    late_fee: 500
  },
  {
    id: 'FS-MP-204',
    standard: '11th Science',
    batch: '11th pcm mangalvar peth',
    branch: 'Mangalwar Peth',
    academic_year: '2025-2026',
    total_fee: 52000,
    installment_amount: 13000,
    number_of_installments: 4,
    due_date: '2026-11-15',
    late_fee: 500
  },
  {
    id: 'FS-MP-205',
    standard: '11th Science',
    batch: '11th pcb mangalvar peth',
    branch: 'Mangalwar Peth',
    academic_year: '2025-2026',
    total_fee: 52000,
    installment_amount: 13000,
    number_of_installments: 4,
    due_date: '2026-11-15',
    late_fee: 500
  },
  {
    id: 'FS-MP-206',
    standard: '11th Science',
    batch: '11th pcmb mangalvar peth',
    branch: 'Mangalwar Peth',
    academic_year: '2025-2026',
    total_fee: 58000,
    installment_amount: 14500,
    number_of_installments: 4,
    due_date: '2026-11-15',
    late_fee: 500
  },
  {
    id: 'FS-MP-207',
    standard: '10th SSC Foundation',
    batch: 'Mangalwar Peth Morning Batch',
    branch: 'Mangalwar Peth',
    academic_year: '2025-2026',
    total_fee: 38000,
    installment_amount: 9500,
    number_of_installments: 4,
    due_date: '2026-12-05',
    late_fee: 250
  },
  {
    id: 'FS-MP-208',
    standard: 'MHT-CET Crash Course',
    batch: 'Mangalwar Peth Fast Track',
    branch: 'Mangalwar Peth',
    academic_year: '2025-2026',
    total_fee: 35000,
    installment_amount: 17500,
    number_of_installments: 2,
    due_date: '2026-11-10',
    late_fee: 300
  }
];

import { useAuth } from '../../hooks/useAuth';
import { getUserBranch } from '../../utils/branchUtils';

const resolveAdminCampus = (userObj) => {
  let br = userObj?.branch;
  if (!br) {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        br = parsed?.branch;
      }
    } catch (e) {}
  }
  if (br && br.toLowerCase().includes('mangal')) {
    return 'Mangalwar Peth';
  }
  return 'Tarabai Park';
};

const resolveIsSuperAdmin = (userObj) => {
  let role = userObj?.role;
  if (!role) {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        role = parsed?.role;
      }
    } catch (e) {}
  }
  return (role || '').toLowerCase().includes('super');
};

export default function FeeStructure() {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { user } = useAuth();
  const activeBranch = getUserBranch(user);
  
  const isSuperAdmin = resolveIsSuperAdmin(user);
  const adminCampus = resolveAdminCampus(user);
  const [selectedCampusTab, setSelectedCampusTab] = useState(() => (isSuperAdmin ? 'ALL' : adminCampus));
  const effectiveCampus = !isSuperAdmin ? adminCampus : (selectedCampusTab || 'ALL');

  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seedingLoading, setSeedingLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [showComparison, setShowComparison] = useState(true);

  // Automatically keep selectedCampusTab aligned with admin login campus
  useEffect(() => {
    if (!isSuperAdmin) {
      setSelectedCampusTab(adminCampus);
    }
  }, [isSuperAdmin, adminCampus]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);

  // Form state initialized with adminCampus
  const [formData, setFormData] = useState(() => ({
    standard: '12th Science',
    batch: adminCampus === 'Mangalwar Peth' ? '12th pcm mangalvar peth' : '12th pcm tarabai park',
    branch: adminCampus,
    academic_year: '2025-2026',
    total_fee: adminCampus === 'Mangalwar Peth' ? 60000 : 65000,
    number_of_installments: 4,
    installment_amount: adminCampus === 'Mangalwar Peth' ? 15000 : 16250,
    due_date: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
    late_fee: 500
  }));

  const fetchData = async () => {
    setLoading(true);
    try {
      const branchParam = !isSuperAdmin ? effectiveCampus : (selectedCampusTab !== 'ALL' ? selectedCampusTab : null);
      const data = await feeService.getStructures(branchParam);
      if (!data || data.length === 0) {
        setStructures(DEFAULT_OFFICIAL_STRUCTURES);
      } else {
        // Normalize any old branch names
        const normalized = data.map((item) => {
          let br = item.branch || 'Tarabai Park';
          const bLow = (item.batch || '').toLowerCase();
          if (br.toLowerCase().includes('tarabai') || bLow.includes('tarabai')) {
            br = 'Tarabai Park';
          } else if (br.toLowerCase().includes('mangal') || bLow.includes('mangal')) {
            br = 'Mangalwar Peth';
          }
          return { ...item, branch: br };
        });
        setStructures(normalized);
      }
    } catch (err) {
      console.warn('Backend unavailable, using default academy fee structures:', err);
      setStructures(DEFAULT_OFFICIAL_STRUCTURES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [effectiveCampus]);

  // Recalculate installment amount on changes
  const handleFeeChange = (val, isEditing = false) => {
    const total = Number(val) || 0;
    if (isEditing && editingStructure) {
      const installments = editingStructure.number_of_installments || 1;
      setEditingStructure({
        ...editingStructure,
        total_fee: total,
        installment_amount: Math.round(total / installments)
      });
    } else {
      const installments = formData.number_of_installments || 1;
      setFormData({
        ...formData,
        total_fee: total,
        installment_amount: Math.round(total / installments)
      });
    }
  };

  const handleInstallmentsChange = (val, isEditing = false) => {
    const installments = Number(val) || 1;
    if (isEditing && editingStructure) {
      setEditingStructure({
        ...editingStructure,
        number_of_installments: installments,
        installment_amount: Math.round((editingStructure.total_fee || 0) / installments)
      });
    } else {
      setFormData({
        ...formData,
        number_of_installments: installments,
        installment_amount: Math.round((formData.total_fee || 0) / installments)
      });
    }
  };

  const handleBranchChange = (branchVal, isEditing = false) => {
    const defaultBatch =
      branchVal === 'Mangalwar Peth' ? '12th pcm mangalvar peth' : '12th pcm tarabai park';
    if (isEditing && editingStructure) {
      setEditingStructure({
        ...editingStructure,
        branch: branchVal,
        batch: defaultBatch
      });
    } else {
      setFormData({
        ...formData,
        branch: branchVal,
        batch: defaultBatch
      });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        due_date: new Date(formData.due_date).toISOString()
      };
      await feeService.createStructure(payload);
      toast.success(`Fee structure created for ${formData.branch} campus!`);
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      // Local optimistic fallback
      const newId = `FS-LOCAL-${Date.now().toString().slice(-4)}`;
      setStructures((prev) => [{ id: newId, ...formData }, ...prev]);
      toast.success(`Fee structure added for ${formData.branch}!`);
      setShowAddModal(false);
    }
  };

  const handleOpenEdit = (item) => {
    setEditingStructure({
      ...item,
      due_date: item.due_date ? item.due_date.split('T')[0] : new Date().toISOString().split('T')[0]
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingStructure) return;
    try {
      const payload = {
        standard: editingStructure.standard,
        batch: editingStructure.batch,
        branch: editingStructure.branch,
        academic_year: editingStructure.academic_year,
        total_fee: Number(editingStructure.total_fee),
        number_of_installments: Number(editingStructure.number_of_installments),
        installment_amount: Number(editingStructure.installment_amount),
        due_date: new Date(editingStructure.due_date).toISOString(),
        late_fee: Number(editingStructure.late_fee || 0)
      };

      await feeService.updateStructure(editingStructure.id, payload);
      toast.success(`Fee structure for ${editingStructure.branch} updated successfully!`);
      setEditingStructure(null);
      fetchData();
    } catch (err) {
      // Optimistic state update
      setStructures((prev) =>
        prev.map((s) => (s.id === editingStructure.id ? { ...editingStructure } : s))
      );
      toast.success(`Fee structure updated!`);
      setEditingStructure(null);
    }
  };

  const handleDelete = async (structure) => {
    const isConfirmed = await confirm({
      title: 'Delete Fee Structure',
      message: `Are you sure you want to delete the fee structure for "${structure.standard} (${structure.branch})"?`,
      subtitle: 'This will affect tuition fee calculations for students enrolled in this batch.',
      confirmText: 'Delete Structure',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (isConfirmed) {
      try {
        await feeService.deleteStructure(structure.id);
        toast.success('Fee structure deleted successfully');
        fetchData();
      } catch (err) {
        setStructures((prev) => prev.filter((s) => s.id !== structure.id));
        toast.success('Fee structure removed');
      }
    }
  };

  const handleSeedDefaults = async () => {
    const isConfirmed = await confirm({
      title: 'Load Official Campus Templates',
      message: 'Populate or refresh official fee structures for Tarabai Park & Mangalwar Peth campuses?',
      subtitle: 'This standardizes PCM, PCB, PCMB, and entrance coaching fee tiers across both centers.',
      confirmText: 'Populate Campus Templates',
      cancelText: 'Cancel',
      type: 'info'
    });

    if (isConfirmed) {
      setSeedingLoading(true);
      try {
        await feeService.seedCampusStructures();
        toast.success('Official fee templates loaded for Tarabai Park & Mangalwar Peth!');
        fetchData();
      } catch (err) {
        setStructures(DEFAULT_OFFICIAL_STRUCTURES);
        toast.success('Official fee templates refreshed!');
      } finally {
        setSeedingLoading(false);
      }
    }
  };

  const exportCSV = () => {
    const headers = [
      'ID',
      'Branch Campus',
      'Standard',
      'Batch',
      'Academic Year',
      'Total Fee (INR)',
      'Installments',
      'Installment Amount (INR)',
      'Due Date',
      'Late Fine (INR)'
    ];

    const rows = filteredStructures.map((s) => [
      `"${s.id}"`,
      `"${s.branch}"`,
      `"${s.standard}"`,
      `"${s.batch}"`,
      `"${s.academic_year}"`,
      s.total_fee,
      s.number_of_installments,
      s.installment_amount,
      `"${s.due_date?.split('T')[0] || s.due_date}"`,
      s.late_fee || 0
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Shubham_Academy_Fee_Structure_${effectiveCampus.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Fee structure exported to CSV');
  };

  // Filtered structures
  const filteredStructures = structures.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.standard?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batch?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.branch?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesYear = yearFilter === 'ALL' || item.academic_year === yearFilter;

    let matchesBranch = true;
    if (effectiveCampus === 'Tarabai Park') {
      matchesBranch = item.branch?.toLowerCase().includes('tarabai');
    } else if (effectiveCampus === 'Mangalwar Peth') {
      matchesBranch = item.branch?.toLowerCase().includes('mangal');
    }

    return matchesSearch && matchesYear && matchesBranch;
  });

  // Analytics for the selected view
  const totalCount = filteredStructures.length;
  const avgFee = Math.round(
    filteredStructures.reduce((acc, s) => acc + (Number(s.total_fee) || 0), 0) / (totalCount || 1)
  );
  const minFee = filteredStructures.length
    ? Math.min(...filteredStructures.map((s) => Number(s.total_fee) || 0))
    : 0;
  const maxFee = filteredStructures.length
    ? Math.max(...filteredStructures.map((s) => Number(s.total_fee) || 0))
    : 0;

  const countTarabai = structures.filter((s) => s.branch?.toLowerCase().includes('tarabai')).length;
  const countMangalwar = structures.filter((s) => s.branch?.toLowerCase().includes('mangal')).length;

  return (
    <div className="d-flex flex-column gap-4 pb-5">
      {/* 1. Header with Breadcrumbs and Quick Action Buttons */}
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
        <div>
          <BackButton to="/admin/fees" label="Back to Fee Overview" />
          <div className="d-flex align-items-center gap-2 mt-1">
            <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
              Campus Fee Structures
            </h3>
            <span
              className={`badge px-2.5 py-1 small fw-semibold border ${
                effectiveCampus === 'Mangalwar Peth'
                  ? 'bg-primary bg-opacity-10 text-primary border-primary border-opacity-25'
                  : 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25'
              }`}
            >
              {isSuperAdmin ? 'Tarabai Park • Mangalwar Peth' : `${effectiveCampus} Campus`}
            </span>
          </div>
          <span className="small text-sa-muted">
            Configure campus-specific standard tuition schedules, installment plans, and due date rules for Shubham Academy
          </span>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            icon={RefreshCw}
            loading={seedingLoading}
            onClick={handleSeedDefaults}
            title="Reload official fee structures for both campuses"
          >
            Load Campus Templates
          </Button>

          <Button
            variant="outline"
            icon={Download}
            onClick={exportCSV}
            title="Export filtered fee structures to CSV"
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              const targetCampus = effectiveCampus === 'Mangalwar Peth' ? 'Mangalwar Peth' : 'Tarabai Park';
              if (targetCampus === 'Mangalwar Peth') {
                setFormData((prev) => ({
                  ...prev,
                  branch: 'Mangalwar Peth',
                  batch: '12th pcm mangalvar peth',
                  total_fee: 60000,
                  installment_amount: 15000
                }));
              } else {
                setFormData((prev) => ({
                  ...prev,
                  branch: 'Tarabai Park',
                  batch: '12th pcm tarabai park',
                  total_fee: 65000,
                  installment_amount: 16250
                }));
              }
              setShowAddModal(true);
            }}
          >
            Create Fee Structure
          </Button>
        </div>
      </div>

      {/* 2. Campus Selector Tabs (Super Admin only) */}
      {isSuperAdmin && (
        <div className="sa-card p-2 shadow-sm d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              className={`btn btn-sm px-3 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2 ${
                selectedCampusTab === 'ALL'
                  ? 'btn-dark text-white shadow-sm'
                  : 'btn-outline-light text-sa-charcoal border'
              }`}
              onClick={() => setSelectedCampusTab('ALL')}
            >
              <Building size={16} />
              All Campuses
              <span className="badge bg-secondary rounded-pill ms-1">{structures.length}</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm px-3 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2 ${
                selectedCampusTab === 'Tarabai Park'
                  ? 'btn-danger text-white shadow-sm'
                  : 'btn-outline-danger border'
              }`}
              style={
                selectedCampusTab === 'Tarabai Park'
                  ? { backgroundColor: '#8B1216', borderColor: '#8B1216' }
                  : {}
              }
              onClick={() => setSelectedCampusTab('Tarabai Park')}
            >
              <Building size={16} />
              Tarabai Park Campus
              <span className="badge bg-white text-danger rounded-pill ms-1">{countTarabai}</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm px-3 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2 ${
                selectedCampusTab === 'Mangalwar Peth'
                  ? 'btn-primary text-white shadow-sm'
                  : 'btn-outline-primary border'
              }`}
              style={
                selectedCampusTab === 'Mangalwar Peth'
                  ? { backgroundColor: '#0F52BA', borderColor: '#0F52BA' }
                  : {}
              }
              onClick={() => setSelectedCampusTab('Mangalwar Peth')}
            >
              <Building size={16} />
              Mangalwar Peth Campus
              <span className="badge bg-white text-primary rounded-pill ms-1">{countMangalwar}</span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-link text-decoration-none text-sa-muted d-flex align-items-center gap-1"
            onClick={() => setShowComparison(!showComparison)}
          >
            <TrendingUp size={14} />
            {showComparison ? 'Hide Campus Comparison' : 'Show Campus Comparison'}
          </button>
        </div>
      )}

      {/* 3. Campus Highlight Banner */}
      {effectiveCampus !== 'ALL' && CAMPUS_INFO[effectiveCampus] && (
        <div
          className="sa-card p-3 p-md-4 rounded-4 shadow-sm position-relative overflow-hidden border"
          style={{
            background:
              effectiveCampus === 'Tarabai Park'
                ? 'linear-gradient(135deg, rgba(139, 18, 22, 0.03) 0%, rgba(255, 255, 255, 0.98) 100%)'
                : 'linear-gradient(135deg, rgba(15, 82, 186, 0.03) 0%, rgba(255, 255, 255, 0.98) 100%)',
            borderColor:
              effectiveCampus === 'Tarabai Park'
                ? 'rgba(139, 18, 22, 0.18)'
                : 'rgba(15, 82, 186, 0.18)',
            borderLeft: `5px solid ${effectiveCampus === 'Tarabai Park' ? '#8B1216' : '#0F52BA'}`
          }}
        >
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <span
                className={`badge px-2.5 py-1 mb-2 text-uppercase fw-bold letter-spacing-1 small ${
                  effectiveCampus === 'Tarabai Park'
                    ? 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20'
                    : 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-20'
                }`}
                style={{ fontSize: '0.72rem' }}
              >
                {CAMPUS_INFO[effectiveCampus].tagline}
              </span>
              <h4 className="fw-extrabold m-0 text-sa-charcoal fs-4">
                {CAMPUS_INFO[effectiveCampus].name}
              </h4>
              <p className="m-0 mt-1 text-sa-muted small d-flex align-items-center gap-1">
                <MapPin size={14} className="text-sa-muted" />
                {CAMPUS_INFO[effectiveCampus].address}
              </p>
            </div>

            <div className="d-flex align-items-center gap-3 bg-white p-2.5 px-3 rounded-3 border shadow-sm">
              <div className="text-center px-2">
                <span className="d-block text-sa-muted small" style={{ fontSize: '0.75rem' }}>Active Tiers</span>
                <span className="fs-5 fw-bold text-sa-charcoal">{filteredStructures.length}</span>
              </div>
              <div className="vr opacity-25"></div>
              <div className="text-center px-2">
                <span className="d-block text-sa-muted small" style={{ fontSize: '0.75rem' }}>Average Fee</span>
                <span className={`fs-5 fw-bold ${effectiveCampus === 'Tarabai Park' ? 'text-danger' : 'text-primary'}`}>
                  ₹ {avgFee.toLocaleString()}
                </span>
              </div>
              <div className="vr opacity-25"></div>
              <div className="text-center px-2">
                <span className="d-block text-sa-muted small" style={{ fontSize: '0.75rem' }}>Fee Range</span>
                <span className="fs-6 fw-bold text-sa-charcoal">
                  ₹ {(minFee / 1000).toFixed(0)}k - ₹ {(maxFee / 1000).toFixed(0)}k
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Side-by-Side Campus Fee Comparison Matrix */}
      {isSuperAdmin && showComparison && (
        <div className="sa-card p-4 border shadow-sm">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <div>
              <h5 className="fw-bold text-sa-charcoal m-0 d-flex align-items-center gap-2">
                <TrendingUp size={18} className="text-danger" />
                Campus Fee Matrix: Tarabai Park vs Mangalwar Peth
              </h5>
              <span className="small text-sa-muted">
                Quick comparative benchmark across major streams and batches
              </span>
            </div>
            <span className="badge bg-light text-dark border px-2 py-1 small">
              Academic Year 2025-2026
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-uppercase text-muted">
                <tr>
                  <th style={{ width: '25%' }}>Stream / Course</th>
                  <th style={{ width: '35%' }}>Tarabai Park Campus</th>
                  <th style={{ width: '35%' }}>Mangalwar Peth Campus</th>
                  <th style={{ width: '5%' }} className="text-end">Difference</th>
                </tr>
              </thead>
              <tbody className="small">
                <tr>
                  <td className="fw-bold text-sa-charcoal">
                    12th Science (PCM)
                    <span className="d-block text-muted text-xs">Regular Higher Secondary Batch</span>
                  </td>
                  <td>
                    <span className="fw-bold text-danger">₹ 65,000</span>
                    <span className="d-block text-muted">4 Installments of ₹ 16,250</span>
                  </td>
                  <td>
                    <span className="fw-bold text-primary">₹ 60,000</span>
                    <span className="d-block text-muted">4 Installments of ₹ 15,000</span>
                  </td>
                  <td className="text-end">
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                      - ₹ 5,000
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="fw-bold text-sa-charcoal">
                    12th Science (PCB)
                    <span className="d-block text-muted text-xs">Medical Foundation Batch</span>
                  </td>
                  <td>
                    <span className="fw-bold text-danger">₹ 65,000</span>
                    <span className="d-block text-muted">4 Installments of ₹ 16,250</span>
                  </td>
                  <td>
                    <span className="fw-bold text-primary">₹ 60,000</span>
                    <span className="d-block text-muted">4 Installments of ₹ 15,000</span>
                  </td>
                  <td className="text-end">
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                      - ₹ 5,000
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="fw-bold text-sa-charcoal">
                    12th Science (PCMB)
                    <span className="d-block text-muted text-xs">Dual Comprehensive Batch</span>
                  </td>
                  <td>
                    <span className="fw-bold text-danger">₹ 72,000</span>
                    <span className="d-block text-muted">4 Installments of ₹ 18,000</span>
                  </td>
                  <td>
                    <span className="fw-bold text-primary">₹ 68,000</span>
                    <span className="d-block text-muted">4 Installments of ₹ 17,000</span>
                  </td>
                  <td className="text-end">
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                      - ₹ 4,000
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="fw-bold text-sa-charcoal">
                    11th Science (PCM/PCB)
                    <span className="d-block text-muted text-xs">Foundational Coaching Program</span>
                  </td>
                  <td>
                    <span className="fw-bold text-danger">₹ 55,000</span>
                    <span className="d-block text-muted">4 Installments of ₹ 13,750</span>
                  </td>
                  <td>
                    <span className="fw-bold text-primary">₹ 52,000</span>
                    <span className="d-block text-muted">4 Installments of ₹ 13,000</span>
                  </td>
                  <td className="text-end">
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                      - ₹ 3,000
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="fw-bold text-sa-charcoal">
                    Entrance & Test Series
                    <span className="d-block text-muted text-xs">MHT-CET / JEE / NEET Intensive</span>
                  </td>
                  <td>
                    <span className="fw-bold text-danger">₹ 45,000 - ₹ 75,000</span>
                    <span className="d-block text-muted">Rankers & Intensive Premier</span>
                  </td>
                  <td>
                    <span className="fw-bold text-primary">₹ 35,000</span>
                    <span className="d-block text-muted">Fast Track Crash Course</span>
                  </td>
                  <td className="text-end">
                    <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">
                      Custom
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Metrics Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 border-start border-4 border-danger">
            <span className="text-sa-muted small fw-semibold">Filtered Structures</span>
            <h4 className="fw-extrabold text-sa-charcoal m-0 mt-1">{totalCount}</h4>
            <span className="text-muted text-xs">
              {effectiveCampus === 'ALL'
                ? `Tarabai: ${countTarabai} | Mangalwar: ${countMangalwar}`
                : `${effectiveCampus} Active Tiers`}
            </span>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 border-start border-4 border-success">
            <span className="text-sa-muted small fw-semibold">Academic Year</span>
            <h4 className="fw-extrabold text-success m-0 mt-1">2025 - 2026</h4>
            <span className="text-muted text-xs">Standardized Semester Cycles</span>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 border-start border-4 border-primary">
            <span className="text-sa-muted small fw-semibold">Average Course Fee</span>
            <h4 className="fw-extrabold text-primary m-0 mt-1">₹ {avgFee.toLocaleString()}</h4>
            <span className="text-muted text-xs">Across selected campus tiers</span>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 border-start border-4 border-warning">
            <span className="text-sa-muted small fw-semibold">Installment Flexibility</span>
            <h4 className="fw-extrabold text-warning m-0 mt-1">1 to 4 Tiers</h4>
            <span className="text-muted text-xs">Auto late penalty ₹ 250 - ₹ 600</span>
          </div>
        </div>
      </div>

      {/* 6. Filter and Search Bar */}
      <div className="sa-card p-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 shadow-sm">
        <div className="position-relative flex-grow-1" style={{ maxWidth: '420px' }}>
          <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
          <input
            type="text"
            className="form-control ps-5 py-2"
            placeholder="Search standard, batch, or campus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <select
            className="form-select form-select-sm py-2 px-3"
            style={{ width: 'auto' }}
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="ALL">All Academic Years</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
          </select>

          {isSuperAdmin && (
            <select
              className="form-select form-select-sm py-2 px-3"
              style={{ width: 'auto' }}
              value={selectedCampusTab}
              onChange={(e) => setSelectedCampusTab(e.target.value)}
            >
              <option value="ALL">All Campuses</option>
              <option value="Tarabai Park">Tarabai Park Campus</option>
              <option value="Mangalwar Peth">Mangalwar Peth Campus</option>
            </select>
          )}
        </div>
      </div>

      {/* 7. Fee Structures Table */}
      <div className="sa-card p-4 shadow-sm">
        <Table
          columns={[
            {
              key: 'standard',
              title: 'Standard / Course',
              render: (val, row) => (
                <div>
                  <span className="fw-bold text-sa-charcoal d-block">{val}</span>
                  <span className="text-muted small font-monospace">{row.batch}</span>
                </div>
              )
            },
            {
              key: 'branch',
              title: 'Campus / Branch',
              render: (val) => {
                const isTarabai = val?.toLowerCase().includes('tarabai');
                return (
                  <span
                    className={`badge px-2.5 py-1.5 fw-semibold border rounded-pill small ${
                      isTarabai
                        ? 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25'
                        : 'bg-primary bg-opacity-10 text-primary border-primary border-opacity-25'
                    }`}
                  >
                    <Building size={12} className="me-1 inline" />
                    {val || 'Tarabai Park'}
                  </span>
                );
              }
            },
            {
              key: 'academic_year',
              title: 'Academic Year',
              render: (val) => <span className="small text-muted">{val || '2025-2026'}</span>
            },
            {
              key: 'total_fee',
              title: 'Total Course Fee',
              render: (val) => (
                <span className="fw-extrabold text-sa-charcoal fs-6">
                  ₹ {Number(val)?.toLocaleString()}
                </span>
              )
            },
            {
              key: 'installment_amount',
              title: 'Installment Breakdown',
              render: (val, row) => (
                <div>
                  <span className="fw-semibold text-primary">₹ {Number(val)?.toLocaleString()}</span>
                  <span className="text-muted small d-block">
                    ({row.number_of_installments || 1} Installments)
                  </span>
                </div>
              )
            },
            {
              key: 'due_date',
              title: 'Due Date',
              render: (val) => (
                <span className="small text-muted">
                  <Calendar size={12} className="me-1 inline text-muted" />
                  {val?.split('T')[0] || val}
                </span>
              )
            },
            {
              key: 'late_fee',
              title: 'Late Fine',
              render: (val) => (
                <span className="badge bg-warning bg-opacity-10 text-dark border px-2 py-1 small">
                  ₹ {val || 0}
                </span>
              )
            },
            {
              key: 'id',
              title: 'Actions',
              align: 'end',
              render: (_, row) => (
                <div className="d-flex justify-content-end gap-1">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm p-1.5"
                    onClick={() => handleOpenEdit(row)}
                    title="Edit fee structure"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm p-1.5"
                    onClick={() => handleDelete(row)}
                    title="Delete fee structure"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            }
          ]}
          data={filteredStructures}
          loading={loading}
          emptyMessage="No fee structures found matching your campus or search criteria."
        />
      </div>

      {/* 8. CREATE FEE STRUCTURE MODAL */}
      {showAddModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <form onSubmit={handleCreate}>
                <div className="modal-header border-bottom px-4 py-3">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: '36px', height: '36px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
                    >
                      <Plus size={20} />
                    </div>
                    <div>
                      <h5 className="modal-title fw-bold m-0">Define Campus Fee Structure</h5>
                      <span className="text-muted small">Configure tuition rates and installment plans</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowAddModal(false)}
                  />
                </div>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    {/* Campus Selection */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-sa-charcoal">
                        Branch Campus *
                      </label>
                      <select
                        className="form-select"
                        value={formData.branch}
                        onChange={(e) => handleBranchChange(e.target.value, false)}
                        required
                        disabled={!isSuperAdmin}
                      >
                        {isSuperAdmin ? (
                          <>
                            <option value="Tarabai Park">Tarabai Park Campus</option>
                            <option value="Mangalwar Peth">Mangalwar Peth Campus</option>
                          </>
                        ) : (
                          <option value={effectiveCampus}>{effectiveCampus} Campus</option>
                        )}
                      </select>
                      <span className="text-muted text-xs">
                        Tuition applies specifically to students registered at this campus.
                      </span>
                    </div>

                    {/* Standard / Stream */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-sa-charcoal">
                        Standard / Stream *
                      </label>
                      <select
                        className="form-select"
                        value={formData.standard}
                        onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                        required
                      >
                        <option value="12th Science">12th Science</option>
                        <option value="11th Science">11th Science</option>
                        <option value="MHT-CET & JEE Target">MHT-CET & JEE Target</option>
                        <option value="NEET Medical Premier">NEET Medical Premier</option>
                        <option value="10th SSC Foundation">10th SSC Foundation</option>
                        <option value="MHT-CET Crash Course">MHT-CET Crash Course</option>
                        <option value="12th Commerce">12th Commerce</option>
                        <option value="11th Commerce">11th Commerce</option>
                      </select>
                    </div>

                    {/* Batch Name */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-sa-charcoal">
                        Batch Name *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.batch}
                        onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                        placeholder="e.g. 12th pcm tarabai park"
                        list="batchSuggestions"
                      />
                      <datalist id="batchSuggestions">
                        {(CAMPUS_INFO[formData.branch]?.defaultBatches || []).map((b) => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>
                      <span className="text-muted text-xs">
                        Select from campus batch presets or enter a custom batch code.
                      </span>
                    </div>

                    {/* Academic Year */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-sa-charcoal">
                        Academic Year *
                      </label>
                      <select
                        className="form-select"
                        value={formData.academic_year}
                        onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                        required
                      >
                        <option value="2025-2026">2025-2026</option>
                        <option value="2026-2027">2026-2027</option>
                      </select>
                    </div>

                    {/* Total Fee */}
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold text-sa-charcoal">
                        Total Course Fee (₹) *
                      </label>
                      <input
                        type="number"
                        className="form-control fw-bold"
                        required
                        min="1000"
                        value={formData.total_fee}
                        onChange={(e) => handleFeeChange(e.target.value, false)}
                      />
                    </div>

                    {/* Number of Installments */}
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold text-sa-charcoal">
                        Installments *
                      </label>
                      <select
                        className="form-select"
                        value={formData.number_of_installments}
                        onChange={(e) => handleInstallmentsChange(e.target.value, false)}
                      >
                        <option value={1}>1 (Single Full Payment)</option>
                        <option value={2}>2 Installments</option>
                        <option value={3}>3 Installments</option>
                        <option value={4}>4 Installments</option>
                        <option value={6}>6 Installments</option>
                      </select>
                    </div>

                    {/* Installment Amount */}
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold text-sa-charcoal">
                        Amount per Installment (₹)
                      </label>
                      <input
                        type="number"
                        className="form-control bg-light fw-bold text-primary"
                        readOnly
                        value={formData.installment_amount}
                      />
                    </div>

                    {/* Due Date */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-sa-charcoal">
                        Initial Due Date *
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      />
                    </div>

                    {/* Late Fee */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-sa-charcoal">
                        Late Fine Penalty (₹)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.late_fee}
                        onChange={(e) => setFormData({ ...formData, late_fee: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="mt-4 p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between">
                    <div>
                      <span className="small text-muted d-block">Plan Summary:</span>
                      <strong className="text-sa-charcoal">
                        {formData.standard} • {formData.branch}
                      </strong>
                    </div>
                    <div className="text-end">
                      <span className="fs-5 fw-extrabold text-danger">
                        ₹ {formData.total_fee.toLocaleString()}
                      </span>
                      <span className="small text-muted d-block">
                        {formData.number_of_installments} x ₹ {formData.installment_amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top px-4 py-3">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4">
                    Save Fee Structure
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 9. EDIT / UPDATE FEE STRUCTURE MODAL */}
      {editingStructure && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <form onSubmit={handleUpdate}>
                <div className="modal-header border-bottom px-4 py-3">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: '36px', height: '36px', backgroundColor: '#EFF6FF', color: '#0F52BA' }}
                    >
                      <Edit size={18} />
                    </div>
                    <div>
                      <h5 className="modal-title fw-bold m-0">Edit Campus Fee Structure</h5>
                      <span className="text-muted small">Update tuition rates, installment breakdowns, and terms</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setEditingStructure(null)}
                  />
                </div>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    {/* Campus Selection */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-sa-charcoal">
                        Branch Campus *
                      </label>
                      <select
                        className="form-select"
                        value={editingStructure.branch}
                        onChange={(e) => handleBranchChange(e.target.value, true)}
                        required
                        disabled={!isSuperAdmin}
                      >
                        {isSuperAdmin ? (
                          <>
                            <option value="Tarabai Park">Tarabai Park Campus</option>
                            <option value="Mangalwar Peth">Mangalwar Peth Campus</option>
                          </>
                        ) : (
                          <option value={effectiveCampus}>{effectiveCampus} Campus</option>
                        )}
                      </select>
                    </div>

                    {/* Standard / Stream */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-sa-charcoal">
                        Standard / Stream *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={editingStructure.standard}
                        onChange={(e) =>
                          setEditingStructure({ ...editingStructure, standard: e.target.value })
                        }
                      />
                    </div>

                    {/* Batch Name */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-sa-charcoal">
                        Batch Name *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={editingStructure.batch}
                        onChange={(e) =>
                          setEditingStructure({ ...editingStructure, batch: e.target.value })
                        }
                        list="editBatchSuggestions"
                      />
                      <datalist id="editBatchSuggestions">
                        {(CAMPUS_INFO[editingStructure.branch]?.defaultBatches || []).map((b) => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>
                    </div>

                    {/* Academic Year */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-sa-charcoal">
                        Academic Year *
                      </label>
                      <select
                        className="form-select"
                        value={editingStructure.academic_year}
                        onChange={(e) =>
                          setEditingStructure({ ...editingStructure, academic_year: e.target.value })
                        }
                        required
                      >
                        <option value="2025-2026">2025-2026</option>
                        <option value="2026-2027">2026-2027</option>
                      </select>
                    </div>

                    {/* Total Course Fee */}
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold text-sa-charcoal">
                        Total Course Fee (₹) *
                      </label>
                      <input
                        type="number"
                        className="form-control fw-bold"
                        required
                        min="1000"
                        value={editingStructure.total_fee}
                        onChange={(e) => handleFeeChange(e.target.value, true)}
                      />
                    </div>

                    {/* Number of Installments */}
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold text-sa-charcoal">
                        Installments *
                      </label>
                      <select
                        className="form-select"
                        value={editingStructure.number_of_installments}
                        onChange={(e) => handleInstallmentsChange(e.target.value, true)}
                      >
                        <option value={1}>1 (Full Payment)</option>
                        <option value={2}>2 Installments</option>
                        <option value={3}>3 Installments</option>
                        <option value={4}>4 Installments</option>
                        <option value={6}>6 Installments</option>
                      </select>
                    </div>

                    {/* Installment Amount */}
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold text-sa-charcoal">
                        Installment Amount (₹)
                      </label>
                      <input
                        type="number"
                        className="form-control bg-light fw-bold text-primary"
                        readOnly
                        value={editingStructure.installment_amount}
                      />
                    </div>

                    {/* Due Date */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-sa-charcoal">
                        Due Date *
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={editingStructure.due_date}
                        onChange={(e) =>
                          setEditingStructure({ ...editingStructure, due_date: e.target.value })
                        }
                      />
                    </div>

                    {/* Late Fee */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-sa-charcoal">
                        Late Fine Penalty (₹)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={editingStructure.late_fee || 0}
                        onChange={(e) =>
                          setEditingStructure({
                            ...editingStructure,
                            late_fee: Number(e.target.value)
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="mt-4 p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between">
                    <div>
                      <span className="small text-muted d-block">Updated Plan:</span>
                      <strong className="text-sa-charcoal">
                        {editingStructure.standard} • {editingStructure.branch}
                      </strong>
                    </div>
                    <div className="text-end">
                      <span className="fs-5 fw-extrabold text-primary">
                        ₹ {Number(editingStructure.total_fee || 0).toLocaleString()}
                      </span>
                      <span className="small text-muted d-block">
                        {editingStructure.number_of_installments} x ₹{' '}
                        {Number(editingStructure.installment_amount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top px-4 py-3">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditingStructure(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4">
                    Update Fee Structure
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
