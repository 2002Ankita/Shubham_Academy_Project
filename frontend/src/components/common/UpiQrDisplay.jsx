import React, { useState } from 'react';
import { Copy, Check, QrCode, ShieldCheck, Smartphone } from 'lucide-react';
import { toast } from 'react-toastify';

export default function UpiQrDisplay({
  branch = 'Tarabai Park',
  upiId = 'shubham.tarabaipark@upi',
  accountName = 'Shubham Academy - Accounts',
  amount = '',
  qrImageUrl = null,
  showCopy = true,
  size = 220
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyUpi = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success(`UPI ID copied: ${upiId}`);
    setTimeout(() => setCopied(false), 2500);
  };

  // Generate standard UPI payment link string
  const upiPayLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(accountName)}${
    amount && Number(amount) > 0 ? `&am=${encodeURIComponent(amount)}` : ''
  }&cu=INR&tn=Fee_Installment_${branch.replace(/\s+/g, '_')}`;

  return (
    <div className="d-flex flex-column align-items-center text-center p-3 rounded-3 bg-white border shadow-xs w-100">
      {/* Branch & Verified Badge */}
      <div className="d-flex align-items-center justify-content-between w-100 mb-2 pb-2 border-bottom">
        <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 fw-bold small">
          📍 {branch} Campus QR
        </span>
        <span className="d-flex align-items-center gap-1 text-success small fw-semibold">
          <ShieldCheck size={15} /> Verified Merchant
        </span>
      </div>

      {/* QR Code Container */}
      <div
        className="position-relative p-2.5 rounded-3 bg-white border border-2 border-sa-ash d-flex flex-column align-items-center justify-content-center shadow-xs"
        style={{ width: `${size + 24}px`, minHeight: `${size + 24}px` }}
      >
        {qrImageUrl ? (
          <img
            src={qrImageUrl}
            alt={`${branch} UPI QR Scanner`}
            className="img-fluid rounded-2 object-fit-contain"
            style={{ width: `${size}px`, height: `${size}px` }}
          />
        ) : (
          /* Realistic high-fidelity SVG UPI QR visual */
          <div className="position-relative d-flex flex-column align-items-center justify-content-center" style={{ width: `${size}px`, height: `${size}px` }}>
            <svg
              viewBox="0 0 200 200"
              width={size}
              height={size}
              className="w-100 h-100"
              style={{ shapeRendering: 'crispEdges' }}
            >
              {/* White background */}
              <rect width="200" height="200" fill="#ffffff" rx="8" />

              {/* Corner Finder 1 (Top Left) */}
              <rect x="14" y="14" width="46" height="46" rx="4" fill="#8B1216" />
              <rect x="22" y="22" width="30" height="30" rx="2" fill="#ffffff" />
              <rect x="28" y="28" width="18" height="18" rx="1.5" fill="#8B1216" />

              {/* Corner Finder 2 (Top Right) */}
              <rect x="140" y="14" width="46" height="46" rx="4" fill="#8B1216" />
              <rect x="148" y="22" width="30" height="30" rx="2" fill="#ffffff" />
              <rect x="154" y="28" width="18" height="18" rx="1.5" fill="#8B1216" />

              {/* Corner Finder 3 (Bottom Left) */}
              <rect x="14" y="140" width="46" height="46" rx="4" fill="#8B1216" />
              <rect x="22" y="148" width="30" height="30" rx="2" fill="#ffffff" />
              <rect x="28" y="154" width="18" height="18" rx="1.5" fill="#8B1216" />

              {/* Alignment Pattern */}
              <rect x="144" y="144" width="28" height="28" rx="2" fill="#1f2937" />
              <rect x="150" y="150" width="16" height="16" rx="1" fill="#ffffff" />
              <rect x="154" y="154" width="8" height="8" fill="#1f2937" />

              {/* Decorative Authentic Data Dots Matrix */}
              <g fill="#1f2937">
                {/* Top Center Data */}
                <rect x="70" y="18" width="8" height="8" rx="1" />
                <rect x="86" y="18" width="8" height="8" rx="1" />
                <rect x="102" y="18" width="8" height="8" rx="1" />
                <rect x="118" y="18" width="8" height="8" rx="1" />
                <rect x="78" y="26" width="8" height="8" rx="1" />
                <rect x="94" y="26" width="8" height="8" rx="1" />
                <rect x="110" y="26" width="8" height="8" rx="1" />
                <rect x="70" y="34" width="8" height="8" rx="1" />
                <rect x="102" y="34" width="8" height="8" rx="1" />
                <rect x="126" y="34" width="8" height="8" rx="1" />
                <rect x="86" y="42" width="8" height="8" rx="1" />
                <rect x="118" y="42" width="8" height="8" rx="1" />
                <rect x="70" y="50" width="8" height="8" rx="1" />
                <rect x="94" y="50" width="8" height="8" rx="1" />
                <rect x="110" y="50" width="8" height="8" rx="1" />

                {/* Left Middle Data */}
                <rect x="18" y="70" width="8" height="8" rx="1" />
                <rect x="34" y="70" width="8" height="8" rx="1" />
                <rect x="50" y="70" width="8" height="8" rx="1" />
                <rect x="26" y="78" width="8" height="8" rx="1" />
                <rect x="42" y="78" width="8" height="8" rx="1" />
                <rect x="18" y="86" width="8" height="8" rx="1" />
                <rect x="34" y="86" width="8" height="8" rx="1" />
                <rect x="50" y="86" width="8" height="8" rx="1" />
                <rect x="26" y="94" width="8" height="8" rx="1" />
                <rect x="42" y="94" width="8" height="8" rx="1" />
                <rect x="18" y="102" width="8" height="8" rx="1" />
                <rect x="50" y="102" width="8" height="8" rx="1" />
                <rect x="26" y="110" width="8" height="8" rx="1" />
                <rect x="42" y="110" width="8" height="8" rx="1" />
                <rect x="18" y="118" width="8" height="8" rx="1" />
                <rect x="34" y="118" width="8" height="8" rx="1" />
                <rect x="50" y="118" width="8" height="8" rx="1" />

                {/* Right Middle Data */}
                <rect x="142" y="70" width="8" height="8" rx="1" />
                <rect x="158" y="70" width="8" height="8" rx="1" />
                <rect x="174" y="70" width="8" height="8" rx="1" />
                <rect x="150" y="78" width="8" height="8" rx="1" />
                <rect x="166" y="78" width="8" height="8" rx="1" />
                <rect x="142" y="86" width="8" height="8" rx="1" />
                <rect x="174" y="86" width="8" height="8" rx="1" />
                <rect x="150" y="94" width="8" height="8" rx="1" />
                <rect x="166" y="94" width="8" height="8" rx="1" />
                <rect x="142" y="102" width="8" height="8" rx="1" />
                <rect x="158" y="102" width="8" height="8" rx="1" />
                <rect x="150" y="110" width="8" height="8" rx="1" />
                <rect x="174" y="110" width="8" height="8" rx="1" />
                <rect x="158" y="118" width="8" height="8" rx="1" />
                <rect x="174" y="118" width="8" height="8" rx="1" />

                {/* Bottom Center Data */}
                <rect x="70" y="142" width="8" height="8" rx="1" />
                <rect x="86" y="142" width="8" height="8" rx="1" />
                <rect x="118" y="142" width="8" height="8" rx="1" />
                <rect x="78" y="150" width="8" height="8" rx="1" />
                <rect x="102" y="150" width="8" height="8" rx="1" />
                <rect x="126" y="150" width="8" height="8" rx="1" />
                <rect x="70" y="158" width="8" height="8" rx="1" />
                <rect x="94" y="158" width="8" height="8" rx="1" />
                <rect x="110" y="158" width="8" height="8" rx="1" />
                <rect x="86" y="166" width="8" height="8" rx="1" />
                <rect x="118" y="166" width="8" height="8" rx="1" />
                <rect x="70" y="174" width="8" height="8" rx="1" />
                <rect x="102" y="174" width="8" height="8" rx="1" />
                <rect x="126" y="174" width="8" height="8" rx="1" />

                {/* Center Cluster Dots */}
                <rect x="70" y="70" width="8" height="8" rx="1" />
                <rect x="118" y="70" width="8" height="8" rx="1" />
                <rect x="86" y="82" width="8" height="8" rx="1" />
                <rect x="102" y="82" width="8" height="8" rx="1" />
                <rect x="70" y="114" width="8" height="8" rx="1" />
                <rect x="118" y="114" width="8" height="8" rx="1" />
              </g>

              {/* Center Academy Emblem */}
              <circle cx="100" cy="100" r="23" fill="#ffffff" stroke="#8B1216" strokeWidth="3" />
              <circle cx="100" cy="100" r="18" fill="#8B1216" />
              <text
                x="100"
                y="105"
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill="#ffffff"
                fontFamily="sans-serif"
              >
                SA
              </text>
            </svg>
          </div>
        )}

        {/* Scan Frame Overlay Corner Accents */}
        <div
          className="position-absolute top-0 start-0 border-top border-start border-3 border-danger rounded-top-2"
          style={{ width: '18px', height: '18px' }}
        />
        <div
          className="position-absolute top-0 end-0 border-top border-end border-3 border-danger rounded-top-2"
          style={{ width: '18px', height: '18px' }}
        />
        <div
          className="position-absolute bottom-0 start-0 border-bottom border-start border-3 border-danger rounded-bottom-2"
          style={{ width: '18px', height: '18px' }}
        />
        <div
          className="position-absolute bottom-0 end-0 border-bottom border-end border-3 border-danger rounded-bottom-2"
          style={{ width: '18px', height: '18px' }}
        />
      </div>

      {/* Payee Info & Dynamic Amount */}
      <div className="mt-2 text-center w-100">
        <div className="fw-bold text-sa-charcoal" style={{ fontSize: '0.92rem' }}>
          {accountName}
        </div>
        {amount && Number(amount) > 0 && (
          <div className="fw-extrabold text-danger fs-5 mt-0.5">
            ₹ {Number(amount).toLocaleString()}
          </div>
        )}
      </div>

      {/* UPI ID with One-Click Copy */}
      {showCopy && (
        <div className="d-flex align-items-center justify-content-between gap-2 px-3 py-1.5 rounded-2 bg-light border mt-2 w-100">
          <div className="text-start overflow-hidden">
            <span className="text-muted d-block" style={{ fontSize: '0.7rem' }}>
              UPI ID
            </span>
            <span className="fw-semibold text-sa-charcoal text-truncate d-block small">
              {upiId}
            </span>
          </div>
          <button
            type="button"
            className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-danger'} d-inline-flex align-items-center gap-1 px-2.5 py-1 rounded-2 shadow-xs`}
            onClick={handleCopyUpi}
            title="Copy UPI ID"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span style={{ fontSize: '0.75rem' }}>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}

      {/* Supported Apps Row */}
      <div className="d-flex align-items-center justify-content-center gap-2 mt-2 pt-2 border-top w-100 text-muted small">
        <Smartphone size={13} className="text-danger" />
        <span style={{ fontSize: '0.75rem' }}>
          Supports <strong>GPay</strong>, <strong>PhonePe</strong>, <strong>Paytm</strong>, <strong>BHIM</strong>
        </span>
      </div>
    </div>
  );
}
