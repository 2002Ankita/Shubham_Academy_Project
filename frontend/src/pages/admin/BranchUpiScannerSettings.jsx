import React, { useState, useEffect, useRef } from 'react';
import BackButton from '../../components/common/BackButton';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import UpiQrDisplay from '../../components/common/UpiQrDisplay';
import feeService from '../../services/feeService';
import { useAuth } from '../../hooks/useAuth';
import { getUserBranch, CAMPUS, isSuperAdminUser } from '../../utils/branchUtils';
import {
  QrCode,
  Upload,
  Image as ImageIcon,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Building2,
  Eye,
  Trash2
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function BranchUpiScannerSettings() {
  const { user } = useAuth();
  const isSuperAdmin = isSuperAdminUser(user);
  const userBranch = getUserBranch(user) || CAMPUS.TARABAI_PARK;

  const [selectedBranch, setSelectedBranch] = useState(userBranch);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Automatically keep selectedBranch in sync with logged-in admin's branch
  useEffect(() => {
    const branch = getUserBranch(user);
    if (branch && (!isSuperAdmin || !selectedBranch)) {
      setSelectedBranch(branch);
    }
  }, [user, isSuperAdmin]);

  // Form State
  const [upiId, setUpiId] = useState('shubham.tarabaipark@upi');
  const [accountName, setAccountName] = useState('Shubham Academy - Tarabai Park Campus');
  const [bankName, setBankName] = useState('HDFC Bank (Tarabai Park, Kolhapur)');
  const [accountNumber, setAccountNumber] = useState('50200088921045');
  const [ifscCode, setIfscCode] = useState('HDFC0001824');
  const [instructions, setInstructions] = useState(
    'Scan QR code using Google Pay, PhonePe, Paytm or BHIM UPI. Enter exact installment amount and submit UTR reference.'
  );
  const [qrImageUrl, setQrImageUrl] = useState(null);
  const [fileName, setFileName] = useState('');

  // Fetch branch scanner configuration
  const loadBranchConfig = async (branchName) => {
    setLoading(true);
    try {
      const data = await feeService.getBranchUpiScanner(branchName);
      if (data) {
        setUpiId(data.upi_id || '');
        setAccountName(data.account_name || `Shubham Academy - ${branchName} Campus`);
        setBankName(data.bank_name || '');
        setAccountNumber(data.account_number || '');
        setIfscCode(data.ifsc_code || '');
        setInstructions(data.instructions || '');
        setQrImageUrl(data.qr_image_url || null);
        setFileName(data.qr_image_url ? 'Active Uploaded Scanner' : '');
      }
    } catch (err) {
      console.error('Failed to load branch UPI scanner:', err);
      toast.error('Failed to load scanner details for ' + branchName);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranchConfig(selectedBranch);
  }, [selectedBranch]);

  const [isDragging, setIsDragging] = useState(false);

  // Process chosen image file
  const processImageFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, or SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setQrImageUrl(event.target?.result);
      toast.success('Scanner image preview loaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  // Handle file input change
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setQrImageUrl(null);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info('Custom QR image removed. Default high-res QR will be used.');
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!upiId || !upiId.includes('@')) {
      toast.error('Please enter a valid UPI ID (e.g. shubham.branch@upi).');
      return;
    }

    if (!accountName.trim()) {
      toast.error('Please enter the merchant / academy account name.');
      return;
    }

    setSaving(true);
    try {
      await feeService.updateBranchUpiScanner({
        branch: selectedBranch,
        upi_id: upiId.trim(),
        account_name: accountName.trim(),
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        ifsc_code: ifscCode.trim(),
        instructions: instructions.trim(),
        qr_image_url: qrImageUrl,
        is_active: true
      });
      toast.success(`UPI Scanner for ${selectedBranch} published to student portal!`);
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save scanner configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="d-flex flex-column gap-4 pb-5">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <BackButton to="/admin/fees" label="Back to Fee Collection" />
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Academic Admin — {selectedBranch} UPI Scanner Management
          </h3>
          <span className="small text-sa-muted">
            Official UPI QR scanner for {selectedBranch} Campus. Automatically configured for {selectedBranch} student payment screens.
          </span>
        </div>

        {/* Branch Selector / Automated Campus Indicator */}
        <div className="d-flex align-items-center gap-2 bg-white px-3 py-2 rounded-2 border shadow-xs">
          <Building2 size={16} className="text-danger" />
          <span className="small fw-semibold text-sa-muted">Configuring Branch:</span>
          {isSuperAdmin ? (
            <select
              className="form-select form-select-sm border-0 bg-transparent fw-bold text-sa-charcoal shadow-none py-0"
              style={{ width: 'auto', cursor: 'pointer' }}
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="Tarabai Park">Tarabai Park Campus</option>
              <option value="Mangalvar Peth">Mangalvar Peth Campus</option>
            </select>
          ) : (
            <span className="fw-semibold text-sa-charcoal" style={{ fontSize: '0.84rem' }}>
              {selectedBranch} Campus
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Form on Left, Student Live Preview on Right */}
      <div className="row g-4">
        {/* Left Form: Scanner & UPI Settings */}
        <div className="col-12 col-xl-7">
          <div className="sa-card p-4 border shadow-sm">
            <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <div className="p-2 rounded-2 bg-danger-subtle text-danger">
                  <QrCode size={20} />
                </div>
                <div>
                  <h5 className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
                    {selectedBranch} UPI QR Scanner Configuration
                  </h5>
                  <span className="text-muted small">
                    Changes here take effect immediately on student payment screens
                  </span>
                </div>
              </div>
              <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 small">
                ● Live & Active
              </span>
            </div>

            <form onSubmit={handleSave} className="d-flex flex-column gap-3">
              {/* QR Code Image Upload Area */}
              <div>
                <label className="form-label text-sa-charcoal fw-semibold mb-1" style={{ fontSize: '0.85rem' }}>
                  Upload Branch UPI QR Scanner Image (PNG / JPG / SVG)
                </label>
                
                {/* Hidden native input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  id="branch-qr-upload-input"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={handleImageFileChange}
                  style={{ display: 'none' }}
                />

                <div
                  className={`p-4 border-2 border-dashed rounded-3 text-center position-relative transition-all ${
                    isDragging ? 'bg-danger-subtle border-danger' : qrImageUrl ? 'bg-success bg-opacity-10 border-success' : 'bg-light border-secondary-subtle'
                  }`}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="d-flex flex-column align-items-center gap-2">
                    {/* The prominent upload / import icon */}
                    <label
                      htmlFor="branch-qr-upload-input"
                      className="p-3 bg-white rounded-circle shadow-sm text-danger d-inline-flex align-items-center justify-content-center border border-danger-subtle"
                      style={{
                        cursor: 'pointer',
                        width: '64px',
                        height: '64px',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      title="Click directly to upload QR scanner image"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <Upload size={30} className="text-danger" />
                    </label>

                    <div>
                      <span className="fw-bold text-sa-charcoal d-block">
                        {fileName ? (
                          <span className="text-success">Selected: {fileName}</span>
                        ) : (
                          'Click on the upload icon or drag & drop QR scanner image here'
                        )}
                      </span>
                      <span className="text-muted small d-block mb-2">
                        Supports high-resolution PNG, JPG, or SVG (Up to 5MB)
                      </span>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-2 shadow-xs fw-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                      >
                        <Upload size={14} /> Browse & Upload Scanner Image
                      </button>
                    </div>
                  </div>
                </div>

                {qrImageUrl && (
                  <div className="d-flex align-items-center justify-content-between mt-2 p-2 bg-success-subtle rounded-2 border border-success-subtle small">
                    <span className="text-success fw-semibold d-flex align-items-center gap-1.5">
                      <CheckCircle2 size={16} /> Custom QR image attached & active for {selectedBranch}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger py-0 px-2 d-flex align-items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                )}
              </div>

              {/* UPI ID & Account Name */}
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <Input
                    label="Branch UPI ID (VPA)"
                    placeholder="e.g. shubham.tarabaipark@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <Input
                    label="Official Payee / Account Name"
                    placeholder="e.g. Shubham Academy Tarabai Park"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Bank Details (For student bank transfer fallback) */}
              <div className="p-3 rounded-2 bg-sa-off-white border">
                <span className="fw-bold text-sa-charcoal small d-block mb-2">
                  Campus Bank Account Details (Optional Reference)
                </span>
                <div className="row g-2">
                  <div className="col-12 col-md-6">
                    <Input
                      label="Bank Name & Branch"
                      placeholder="e.g. HDFC Bank, Tarabai Park"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <Input
                      label="Account Number"
                      placeholder="e.g. 50200088921045"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <Input
                      label="IFSC Code"
                      placeholder="e.g. HDFC0001824"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Student Instructions */}
              <div>
                <label className="form-label text-sa-charcoal fw-semibold mb-1" style={{ fontSize: '0.85rem' }}>
                  Student Payment Instructions
                </label>
                <textarea
                  className="form-control border-sa-ash shadow-none"
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Instructions displayed to students when making UPI payments"
                />
              </div>

              {/* Save Button */}
              <div className="d-flex justify-content-end gap-2 pt-3 border-top">
                <Button
                  type="button"
                  variant="outline"
                  icon={RotateCcw}
                  onClick={() => loadBranchConfig(selectedBranch)}
                  disabled={loading || saving}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={Save}
                  loading={saving}
                  disabled={loading}
                >
                  Save & Publish UPI Scanner
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Live Student Modal Preview */}
        <div className="col-12 col-xl-5">
          <div className="sa-card p-4 border shadow-sm sticky-top" style={{ top: '24px' }}>
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <Eye size={18} className="text-danger" />
                <h5 className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
                  Live Student Modal Preview
                </h5>
              </div>
              <span className="badge bg-secondary-subtle text-secondary small">
                Student View
              </span>
            </div>

            <div className="p-3 bg-light rounded-3 border">
              <div className="bg-white rounded-3 shadow-xs border p-3">
                <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                  <span className="fw-bold text-sa-charcoal small">
                    Pay Fee Installment (Preview)
                  </span>
                  <span className="badge bg-danger text-white small">Live QR</span>
                </div>

                {/* Embedded QR Scanner Display */}
                <UpiQrDisplay
                  branch={selectedBranch}
                  upiId={upiId || 'shubham.branch@upi'}
                  accountName={accountName || 'Shubham Academy'}
                  amount="25000"
                  qrImageUrl={qrImageUrl}
                  size={190}
                />

                <div className="mt-3 p-2.5 rounded-2 bg-sa-off-white border small text-muted">
                  <strong>Instruction shown to student:</strong>
                  <div className="mt-1" style={{ fontSize: '0.8rem' }}>
                    {instructions || 'Scan with GPay/PhonePe and submit UTR reference.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 text-muted small d-flex align-items-center gap-1.5">
              <AlertCircle size={14} className="text-primary flex-shrink-0" />
              <span>
                Students belonging to <strong>{selectedBranch}</strong> will see this exact QR code scanner when paying fees.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
