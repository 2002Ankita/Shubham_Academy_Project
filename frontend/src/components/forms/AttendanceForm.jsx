import React, { useState } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { ScanLine, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AttendanceForm({ onScanRfid, onManualSubmit, loading }) {
  const [rfidCard, setRfidCard] = useState('');
  const [gate, setGate] = useState('Gate 1 (Main Entrance)');
  const [scanResult, setScanResult] = useState(null);

  const handleRfidScan = async (e) => {
    e.preventDefault();
    if (!rfidCard.trim()) return;

    try {
      const res = await onScanRfid(rfidCard, gate);
      setScanResult({
        success: true,
        message: res.message || `Card ${rfidCard} logged successfully!`,
        student: res.entry?.studentName || 'Student Identified'
      });
      setRfidCard('');
    } catch {
      setScanResult({
        success: false,
        message: 'Invalid Card ID or Communication Timeout.'
      });
    }
  };

  return (
    <div className="sa-card p-4">
      <div className="d-flex align-items-center gap-2 mb-3">
        <ScanLine size={22} className="text-sa-primary" />
        <h5 className="brand-font fw-bold m-0 text-sa-charcoal fs-6">
          Live RFID Scanner Terminal
        </h5>
      </div>

      <p className="small text-sa-muted mb-4">
        Connect RFID USB reader or simulate card swipe. The system automatically fetches student details and triggers an SMS alert to parents.
      </p>

      {scanResult && (
        <div
          className={`alert ${scanResult.success ? 'alert-success' : 'alert-danger'} d-flex align-items-center gap-2 py-2 px-3 mb-3`}
          role="alert"
        >
          {scanResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <div className="small fw-semibold">
            {scanResult.message} {scanResult.student ? `(${scanResult.student})` : ''}
          </div>
        </div>
      )}

      <form onSubmit={handleRfidScan}>
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-5">
            <Input
              label="Scan or Enter RFID Card UID"
              name="rfidCard"
              placeholder="e.g. RFID-984210"
              value={rfidCard}
              onChange={(e) => setRfidCard(e.target.value)}
              helperText="Press Enter after scanning badge"
              autoFocus
              required
            />
          </div>

          <div className="col-12 col-md-4">
            <Select
              label="Access Gate"
              name="gate"
              value={gate}
              onChange={(e) => setGate(e.target.value)}
              options={[
                'Gate 1 (Main Entrance)',
                'Gate 2 (Library & Study Hall)',
                'Classroom Door 4 (Biometric)',
                'Admin Front Desk'
              ]}
            />
          </div>

          <div className="col-12 col-md-3 mb-3">
            <Button
              type="submit"
              variant="primary"
              className="w-100 py-2"
              loading={loading}
              icon={ScanLine}
            >
              Log Card Tap
            </Button>
          </div>
        </div>
      </form>

      {/* Quick Test Demo RFID Badges */}
      <div className="mt-3 pt-3 border-top">
        <span className="text-xs fw-semibold text-sa-muted me-2" style={{ fontSize: '0.75rem' }}>
          Test Quick Badges:
        </span>
        <button
          type="button"
          className="badge bg-light text-dark border me-2 py-1 px-2 pointer"
          onClick={() => setRfidCard('RFID-984210')}
        >
          Aarav (RFID-984210)
        </button>
        <button
          type="button"
          className="badge bg-light text-dark border me-2 py-1 px-2 pointer"
          onClick={() => setRfidCard('RFID-984211')}
        >
          Ananya (RFID-984211)
        </button>
        <button
          type="button"
          className="badge bg-light text-dark border py-1 px-2 pointer"
          onClick={() => setRfidCard('RFID-984212')}
        >
          Rohan (RFID-984212)
        </button>
      </div>
    </div>
  );
}
