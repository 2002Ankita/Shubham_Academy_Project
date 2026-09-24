import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  Building2,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Users,
  CheckCircle2,
  PhoneCall,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Super Administrator Desk',
    priority: 'Normal',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCampus, setActiveCampus] = useState('kolhapur');

  const campuses = [
    {
      id: 'kolhapur',
      name: 'Kolhapur Main Campus',
      tag: 'Headquarters & Central Admin',
      address: 'Shubham Academy Complex, Rajarampuri 5th Lane, Kolhapur, Maharashtra - 416008',
      admin: 'Shubham Sharma (Super Administrator)',
      phone: '+91 (0231) 2654321 / +91 98220 12345',
      email: 'kolhapur@shubhamacademy.edu.in',
      timing: 'Monday – Saturday: 8:00 AM – 7:30 PM',
      students: '1,248 Enrolled',
      faculty: '48 Teachers'
    },
    {
      id: 'pune',
      name: 'Pune Campus',
      tag: 'Branch Campus & Science Wing',
      address: 'Plot 42, Fergusson College Road, Shivajinagar, Pune, Maharashtra - 411005',
      admin: 'Prof. Rajesh Patil (Campus Principal)',
      phone: '+91 (020) 25531000 / +91 98220 54321',
      email: 'pune@shubhamacademy.edu.in',
      timing: 'Monday – Saturday: 8:30 AM – 7:00 PM',
      students: '850 Enrolled',
      faculty: '28 Teachers'
    },
    {
      id: 'sangli',
      name: 'Sangli Campus',
      tag: 'Branch Campus & Commerce Wing',
      address: 'Opp. Willingdon College, Vishrambag, Sangli, Maharashtra - 416415',
      admin: 'Dr. Priya Kulkarni (Branch Dean)',
      phone: '+91 (0233) 2441234 / +91 98220 67890',
      email: 'sangli@shubhamacademy.edu.in',
      timing: 'Monday – Saturday: 8:30 AM – 6:30 PM',
      students: '620 Enrolled',
      faculty: '22 Teachers'
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Your message has been sent to the administration team! Ticket #TKT-' + Math.floor(10000 + Math.random() * 90000));
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: 'Super Administrator Desk',
        priority: 'Normal',
        subject: '',
        message: ''
      });
    }, 600);
  };

  return (
    <div className="d-flex flex-column gap-4" style={{ maxWidth: '1120px' }}>
      {/* Page Title */}
      <div>
        <div className="d-flex align-items-center gap-2">
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">Contact & Campus Directory</h3>
          <span
            className="badge px-2.5 py-1 rounded-pill"
            style={{ backgroundColor: '#FDF0F0', color: 'var(--sa-primary)', fontSize: '0.75rem' }}
          >
            Institutional Directory
          </span>
        </div>
        <span className="small text-sa-muted">
          Official contact channels, branch campus hotlines, and central support desk for Shubham Academy.
        </span>
      </div>

      {/* 4 Quick Info Cards */}
      <div className="row g-3">
        {/* Central Hotline */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="sa-card bg-white p-3.5 rounded-3 border h-100 d-flex flex-column justify-content-between">
            <div className="d-flex align-items-center gap-3 mb-2">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '44px', height: '44px', backgroundColor: '#FDF0F0', color: 'var(--sa-primary)' }}
              >
                <PhoneCall size={20} />
              </div>
              <div>
                <span className="text-sa-muted fw-medium d-block" style={{ fontSize: '0.76rem' }}>
                  CENTRAL HOTLINE
                </span>
                <span className="fw-bold text-sa-charcoal" style={{ fontSize: '0.98rem' }}>
                  +91 98220 12345
                </span>
              </div>
            </div>
            <span className="text-sa-muted small" style={{ fontSize: '0.78rem' }}>
              Direct line to Head Office Reception & Admissions
            </span>
          </div>
        </div>

        {/* Official Email */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="sa-card bg-white p-3.5 rounded-3 border h-100 d-flex flex-column justify-content-between">
            <div className="d-flex align-items-center gap-3 mb-2">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '44px', height: '44px', backgroundColor: '#FEF8EB', color: '#D97718' }}
              >
                <Mail size={20} />
              </div>
              <div className="overflow-hidden">
                <span className="text-sa-muted fw-medium d-block" style={{ fontSize: '0.76rem' }}>
                  OFFICIAL EMAIL
                </span>
                <span className="fw-bold text-sa-charcoal text-truncate d-block" style={{ fontSize: '0.86rem' }} title="contact@shubhamacademy.edu.in">
                  contact@shubhamacademy.edu.in
                </span>
              </div>
            </div>
            <span className="text-sa-muted small" style={{ fontSize: '0.78rem' }}>
              Guaranteed response within 24 business hours
            </span>
          </div>
        </div>

        {/* Head Office Location */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="sa-card bg-white p-3.5 rounded-3 border h-100 d-flex flex-column justify-content-between">
            <div className="d-flex align-items-center gap-3 mb-2">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '44px', height: '44px', backgroundColor: '#EBF5F0', color: '#168554' }}
              >
                <MapPin size={20} />
              </div>
              <div>
                <span className="text-sa-muted fw-medium d-block" style={{ fontSize: '0.76rem' }}>
                  HEADQUARTERS
                </span>
                <span className="fw-bold text-sa-charcoal" style={{ fontSize: '0.98rem' }}>
                  Kolhapur, MH
                </span>
              </div>
            </div>
            <span className="text-sa-muted small" style={{ fontSize: '0.78rem' }}>
              Rajarampuri 5th Lane, Central Campus Complex
            </span>
          </div>
        </div>

        {/* Operational Timings */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="sa-card bg-white p-3.5 rounded-3 border h-100 d-flex flex-column justify-content-between">
            <div className="d-flex align-items-center gap-3 mb-2">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '44px', height: '44px', backgroundColor: '#F0F4FD', color: '#2563EB' }}
              >
                <Clock size={20} />
              </div>
              <div>
                <span className="text-sa-muted fw-medium d-block" style={{ fontSize: '0.76rem' }}>
                  CAMPUS HOURS
                </span>
                <span className="fw-bold text-sa-charcoal" style={{ fontSize: '0.98rem' }}>
                  8:00 AM – 7:30 PM
                </span>
              </div>
            </div>
            <span className="text-sa-muted small" style={{ fontSize: '0.78rem' }}>
              Monday through Saturday (Admin closed Sundays)
            </span>
          </div>
        </div>
      </div>

      {/* Main Section: Campus Directory & Direct Contact Form */}
      <div className="row g-4">
        {/* Left Col: Campus Locations */}
        <div className="col-12 col-lg-6 d-flex flex-column gap-3">
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="fw-bold text-sa-charcoal m-0 d-flex align-items-center gap-2">
              <Building2 size={19} className="text-sa-primary" />
              Campus Directory & Locations
            </h5>
            <span className="badge bg-light text-muted border">{campuses.length} Campuses</span>
          </div>

          {/* Campus Selector Pills */}
          <div className="d-flex gap-2">
            {campuses.map((campus) => (
              <button
                key={campus.id}
                type="button"
                className={`btn btn-sm px-3 py-1.5 rounded-pill fw-medium transition-all ${
                  activeCampus === campus.id
                    ? 'btn-danger text-white shadow-sm'
                    : 'btn-light border text-sa-charcoal'
                }`}
                style={{
                  backgroundColor: activeCampus === campus.id ? 'var(--sa-primary)' : '',
                  borderColor: activeCampus === campus.id ? 'var(--sa-primary)' : 'var(--sa-border)',
                  fontSize: '0.82rem'
                }}
                onClick={() => setActiveCampus(campus.id)}
              >
                {campus.name.replace(' Campus', '')}
              </button>
            ))}
          </div>

          {/* Selected Campus Detail Card */}
          {(() => {
            const selected = campuses.find((c) => c.id === activeCampus) || campuses[0];
            return (
              <div
                className="sa-card p-4 rounded-3 border bg-white position-relative"
                style={{
                  borderLeft: '4px solid var(--sa-primary)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5 className="fw-bold text-sa-charcoal mb-0.5">{selected.name}</h5>
                    <span className="badge bg-sa-off-white text-sa-primary border small">
                      {selected.tag}
                    </span>
                  </div>
                  <span className="badge bg-success-subtle text-success small border border-success-subtle d-flex align-items-center gap-1">
                    <CheckCircle2 size={12} /> Active Branch
                  </span>
                </div>

                <hr className="my-3 text-muted opacity-25" />

                <div className="d-flex flex-column gap-2.5">
                  <div className="d-flex align-items-start gap-2.5">
                    <MapPin size={17} className="text-sa-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-muted text-xs d-block" style={{ fontSize: '0.75rem' }}>CAMPUS ADDRESS</span>
                      <span className="text-sa-charcoal small fw-medium">{selected.address}</span>
                    </div>
                  </div>

                  <div className="d-flex align-items-start gap-2.5">
                    <Users size={17} className="text-sa-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-muted text-xs d-block" style={{ fontSize: '0.75rem' }}>CAMPUS HEAD / IN-CHARGE</span>
                      <span className="text-sa-charcoal small fw-medium">{selected.admin}</span>
                    </div>
                  </div>

                  <div className="d-flex align-items-start gap-2.5">
                    <Phone size={17} className="text-sa-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-muted text-xs d-block" style={{ fontSize: '0.75rem' }}>TELEPHONE & HOTLINE</span>
                      <span className="text-sa-charcoal small fw-medium">{selected.phone}</span>
                    </div>
                  </div>

                  <div className="d-flex align-items-start gap-2.5">
                    <Mail size={17} className="text-sa-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-muted text-xs d-block" style={{ fontSize: '0.75rem' }}>OFFICIAL BRANCH EMAIL</span>
                      <span className="text-sa-charcoal small fw-medium">{selected.email}</span>
                    </div>
                  </div>

                  <div className="d-flex align-items-start gap-2.5">
                    <Clock size={17} className="text-sa-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-muted text-xs d-block" style={{ fontSize: '0.75rem' }}>OFFICE HOURS</span>
                      <span className="text-sa-charcoal small fw-medium">{selected.timing}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-top d-flex align-items-center justify-content-between bg-light p-2.5 rounded-2">
                  <span className="small text-sa-charcoal fw-semibold">
                    Strength: <span className="text-sa-primary">{selected.students}</span>
                  </span>
                  <span className="small text-muted">
                    Faculty: <span className="fw-semibold text-sa-charcoal">{selected.faculty}</span>
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Emergency Escalations Alert Box */}
          <div className="sa-card p-3 rounded-3 border bg-white">
            <h6 className="fw-bold text-sa-charcoal mb-2 d-flex align-items-center gap-1.5" style={{ fontSize: '0.88rem' }}>
              <AlertCircle size={16} className="text-danger" />
              24/7 Emergency & Escalation Numbers
            </h6>
            <div className="row g-2">
              <div className="col-12 col-sm-4">
                <div className="p-2 rounded bg-light border">
                  <span className="text-muted d-block" style={{ fontSize: '0.7rem' }}>CAMPUS SECURITY</span>
                  <span className="fw-bold text-sa-charcoal small">+91 98220 99911</span>
                </div>
              </div>
              <div className="col-12 col-sm-4">
                <div className="p-2 rounded bg-light border">
                  <span className="text-muted d-block" style={{ fontSize: '0.7rem' }}>FIRST AID / MEDICAL</span>
                  <span className="fw-bold text-sa-charcoal small">+91 98220 99922</span>
                </div>
              </div>
              <div className="col-12 col-sm-4">
                <div className="p-2 rounded bg-light border">
                  <span className="text-muted d-block" style={{ fontSize: '0.7rem' }}>IT INFRASTRUCTURE</span>
                  <span className="fw-bold text-sa-charcoal small">+91 98220 99933</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Interactive Support & Contact Form */}
        <div className="col-12 col-lg-6">
          <form
            onSubmit={handleSubmit}
            className="sa-card p-4 rounded-3 border bg-white d-flex flex-column gap-3 h-100"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <div>
              <h5 className="fw-bold text-sa-charcoal mb-0.5 d-flex align-items-center gap-2">
                <MessageSquare size={19} className="text-sa-primary" />
                Administrative Support Desk
              </h5>
              <p className="text-sa-muted small m-0">
                Directly submit an official query, grievance, or administrative request
              </p>
            </div>

            <div className="row g-3">
              {/* Sender Name */}
              <div className="col-12 col-sm-6">
                <Input
                  label="Your Full Name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Omkar Chavan"
                  required
                />
              </div>

              {/* Email */}
              <div className="col-12 col-sm-6">
                <Input
                  label="Contact Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@shubham.edu"
                  required
                />
              </div>

              {/* Phone */}
              <div className="col-12 col-sm-6">
                <Input
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>

              {/* Department */}
              <div className="col-12 col-sm-6">
                <label className="form-label small fw-semibold text-sa-charcoal">
                  Target Department <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select form-select-sm py-2"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="Super Administrator Desk">Super Administrator Desk</option>
                  <option value="Admissions & Student Welfare">Admissions & Student Welfare</option>
                  <option value="Accounts & Fee Helpdesk">Accounts & Fee Helpdesk</option>
                  <option value="Examinations & Marks Cell">Examinations & Marks Cell</option>
                  <option value="RFID Attendance & Technical Support">RFID Attendance & Technical Support</option>
                </select>
              </div>

              {/* Priority */}
              <div className="col-12 col-sm-6">
                <label className="form-label small fw-semibold text-sa-charcoal">
                  Priority Level
                </label>
                <div className="d-flex gap-2">
                  {['Normal', 'High', 'Urgent'].map((pri) => (
                    <button
                      key={pri}
                      type="button"
                      className={`btn btn-sm flex-grow-1 py-1.5 rounded fw-semibold transition-all ${
                        formData.priority === pri ? 'text-white shadow-sm' : 'btn-light border text-sa-charcoal'
                      }`}
                      style={{
                        backgroundColor: formData.priority === pri ? 'var(--sa-primary)' : '#f8fafc',
                        borderColor: formData.priority === pri ? 'var(--sa-primary)' : 'var(--sa-border)',
                        color: formData.priority === pri ? '#ffffff' : 'var(--sa-charcoal)',
                        fontSize: '0.82rem'
                      }}
                      onClick={() => setFormData({ ...formData, priority: pri })}
                    >
                      {pri}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="col-12 col-sm-6">
                <Input
                  label="Subject / Concern"
                  name="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief summary of request"
                  required
                />
              </div>

              {/* Message */}
              <div className="col-12">
                <label className="form-label small fw-semibold text-sa-charcoal">
                  Detailed Message / Description <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Provide all relevant details, student IDs, or campus information..."
                  style={{ fontSize: '0.88rem' }}
                  required
                />
              </div>
            </div>

            <div className="d-flex justify-content-end pt-2 border-top mt-auto">
              <Button type="submit" variant="primary" icon={Send} disabled={isSubmitting}>
                {isSubmitting ? 'Transmitting Request...' : 'Send Message / Raise Ticket'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
