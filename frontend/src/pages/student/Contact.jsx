import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import BackButton from '../../components/common/BackButton';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  IndianRupee,
  Users,
  Calendar,
  FileText,
  BookOpen,
  User,
  ChevronDown,
  Navigation,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

export default function StudentContact() {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeBranch, setActiveBranch] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [copied, setCopied] = useState(false);

  const mainPhone = '07947123254';
  const mainEmail = 'info@shubhamacademy.in';

  const campuses = [
    {
      id: 'shivaji-peth',
      name: 'Shivaji Peth Campus',
      shortName: 'Shivaji Peth',
      tag: 'Classrooms & Academic Center',
      address: 'C Ward, Near S.M.Lohiya College, Behind Axis Bank, New Mahadwar Road, Shivaji Peth A Ward, Kolhapur-416012, Maharashtra',
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Near+S.M.Lohiya+College+Behind+Axis+Bank+New+Mahadwar+Road+Shivaji+Peth+Kolhapur+416012',
      embedMap: 'https://maps.google.com/maps?q=16.6917,74.2230&hl=en&z=15&output=embed'
    },
    {
      id: 'tarabai-park',
      name: 'Tarabai Park Campus',
      shortName: 'Tarabai Park',
      tag: 'Head Office & Administration',
      address: '3rd Floor, The Mird House, Tarabai Park, Opposite Swami Vivekananda College Road, Tarabai Park, Kolhapur-416003, Maharashtra',
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=3rd+Floor+The+Mird+House+Tarabai+Park+Opposite+Swami+Vivekananda+College+Road+Kolhapur+416003',
      embedMap: 'https://maps.google.com/maps?q=16.7118,74.2408&hl=en&z=15&output=embed'
    }
  ];

  const currentCampus = campuses[activeBranch];

  const faqs = [
    {
      id: 1,
      icon: IndianRupee,
      question: 'How do I check my fees?',
      answer: 'Go to the Fees & Receipts section from the left sidebar. There you can view your total fees, installment breakdown, pending dues, and download official payment receipts.'
    },
    {
      id: 2,
      icon: Users,
      question: 'How can I contact faculty?',
      answer: 'Subject teachers are available for doubt-clearing sessions from 4:00 PM to 6:00 PM on weekdays. You can also connect during class or speak with the academic coordinator.'
    },
    {
      id: 3,
      icon: Calendar,
      question: 'How to view attendance?',
      answer: 'Navigate to the Attendance tab to view your real-time daily RFID punch logs, monthly attendance percentage, and leave history.'
    },
    {
      id: 4,
      icon: FileText,
      question: 'Where can I see exam results?',
      answer: 'Click on Examinations > Results in your student portal to see subject-wise marks, class ranks, performance trends, and downloadable report cards.'
    },
    {
      id: 5,
      icon: BookOpen,
      question: 'How can I download study materials?',
      answer: 'Open the Study Materials & Notes section to access and download PDF lecture notes, formulas, assignments, and test series solutions uploaded by your faculty.'
    },
    {
      id: 6,
      icon: User,
      question: 'How to update my profile details?',
      answer: 'Click your profile avatar at the top right of the dashboard and select Profile. You can update your contact information or request official record corrections.'
    }
  ];

  const toggleFaq = (id) => {
    setOpenFaq((prev) => (prev === id ? null : id));
  };

  const handleCopyAddress = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Address copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject || !formData.message.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const ticketNo = 'MSG-' + Math.floor(10000 + Math.random() * 90000);
      toast.success(`Message sent successfully! Reference #${ticketNo}`);
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        subject: '',
        message: ''
      });
    }, 600);
  };

  return (
    <div className="d-flex flex-column gap-4 pb-4" style={{ maxWidth: '1160px', margin: '0 auto' }}>
      {/* Back button */}
      <div>
        <BackButton to="/student/dashboard" label="Back to Dashboard" />
      </div>

      {/* 1. Header Hero Banner matching exact user reference image */}
      <div
        className="rounded-3 border px-4 py-3.5 px-md-5 py-md-4 position-relative overflow-hidden shadow-sm"
        style={{
          background: 'linear-gradient(90deg, #FBF6EE 0%, #F8EFE0 55%, #F4E8D4 100%)',
          borderColor: '#EADBCA'
        }}
      >
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          {/* Left Text: GET IN TOUCH, Contact Us, Subtitle */}
          <div>
            <span
              className="text-uppercase fw-bold d-block"
              style={{
                color: '#D97718',
                fontSize: '0.78rem',
                letterSpacing: '0.07em'
              }}
            >
              GET IN TOUCH
            </span>
            <h2
              className="brand-font fw-extrabold m-0 mt-0.5"
              style={{
                color: 'var(--sa-primary, #8B1216)',
                fontSize: '2.1rem',
                letterSpacing: '-0.02em',
                lineHeight: 1.15
              }}
            >
              Contact Us
            </h2>
            <p className="text-sa-muted mt-1 mb-0" style={{ fontSize: '0.92rem' }}>
              We're here to help you with your queries. Feel free to reach out to us.
            </p>
          </div>

          {/* Right Artwork: "Your Success Our Priority" + Maroon Envelope & Flight Trail to Plane */}
          <div className="d-flex align-items-center justify-content-end gap-3 flex-shrink-0">
            {/* Cursive slogan matching reference screenshot */}
            <div
              className="text-end d-none d-sm-block me-1"
              style={{ transform: 'rotate(-4deg)' }}
            >
              <span
                style={{
                  fontFamily: "'Caveat', 'Playfair Display', cursive, 'Brush Script MT', sans-serif",
                  fontSize: '1.45rem',
                  color: 'var(--sa-primary, #8B1216)',
                  fontWeight: 700,
                  display: 'block',
                  lineHeight: 1.15
                }}
              >
                Your Success
                <br />
                Our Priority
              </span>
              {/* Golden curved underline */}
              <svg width="105" height="12" viewBox="0 0 105 12" fill="none" style={{ display: 'block', marginTop: '1px', marginLeft: 'auto' }}>
                <path d="M3 4C28 10 75 11 102 3" stroke="#D97718" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* Envelope + Flying paper plane illustration */}
            <div className="position-relative" style={{ width: '135px', height: '80px' }}>
              {/* Soft organic blob background */}
              <div
                className="position-absolute"
                style={{
                  width: '95px',
                  height: '75px',
                  background: 'rgba(235, 215, 185, 0.45)',
                  borderRadius: '50% 40% 60% 40%',
                  top: '5px',
                  right: '5px',
                  zIndex: 1
                }}
              />

              {/* Dotted path and golden-orange paper plane */}
              <svg
                className="position-absolute"
                style={{ top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, overflow: 'visible' }}
                viewBox="0 0 135 80"
                fill="none"
              >
                {/* Dotted looped trail */}
                <path
                  d="M 42 46 C 52 16, 82 12, 88 32 C 94 52, 108 46, 116 18"
                  stroke="#C29D75"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                {/* Paper Plane */}
                <g transform="translate(112, 10) rotate(-15)">
                  <path d="M0 8 L18 0 L14 18 L9 11 Z" fill="#D97718" />
                  <path d="M18 0 L9 11 L6 8 Z" fill="#E69500" />
                </g>
              </svg>

              {/* Maroon Envelope */}
              <div
                className="position-absolute shadow-sm d-flex align-items-center justify-content-center"
                style={{
                  bottom: '12px',
                  left: '8px',
                  width: '56px',
                  height: '40px',
                  backgroundColor: 'var(--sa-primary, #8B1216)',
                  borderRadius: '5px',
                  zIndex: 3
                }}
              >
                <svg width="56" height="40" viewBox="0 0 56 40" fill="none">
                  <rect width="56" height="40" rx="5" fill="#8B1216" />
                  {/* Flap lines */}
                  <path d="M3 4 L28 23 L53 4" stroke="#F5A900" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 36 L19 20" stroke="#A9282D" strokeWidth="1.2" />
                  <path d="M53 36 L37 20" stroke="#A9282D" strokeWidth="1.2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Two Columns: "Get in Touch" & "Send Us a Message" */}
      <div className="row g-4 align-items-stretch">
        {/* Left Column: Get in Touch */}
        <div className="col-12 col-lg-5">
          <div
            className="bg-white p-4 p-md-4.5 rounded-3 border h-100 shadow-sm"
            style={{ borderColor: 'var(--sa-border, #E2E8F0)' }}
          >
            <h4
              className="brand-font fw-bold mb-1"
              style={{ color: 'var(--sa-primary, #8B1216)', fontSize: '1.25rem' }}
            >
              Get in Touch
            </h4>
            <p className="text-sa-muted small mb-4" style={{ fontSize: '0.86rem' }}>
              You can reach us through the following details:
            </p>

            {/* Contact List */}
            <div className="d-flex flex-column gap-4">
              {/* 1. Visit Us (With extra spacing below address line as requested) */}
              <div className="d-flex align-items-start gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: '42px',
                    height: '42px',
                    backgroundColor: '#FAF3E7',
                    color: 'var(--sa-primary, #8B1216)'
                  }}
                >
                  <MapPin size={20} />
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="fw-bold text-sa-charcoal d-block" style={{ fontSize: '0.94rem' }}>
                      Visit Us
                    </span>
                    {/* Branch Toggle pills */}
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        type="button"
                        onClick={() => setActiveBranch(0)}
                        className={`btn btn-xs py-0.5 px-2 rounded-start-pill ${
                          activeBranch === 0 ? 'text-white' : 'btn-light border'
                        }`}
                        style={{
                          backgroundColor: activeBranch === 0 ? 'var(--sa-primary, #8B1216)' : '#FAF8F5',
                          fontSize: '0.70rem',
                          fontWeight: 600
                        }}
                      >
                        Shivaji Peth
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveBranch(1)}
                        className={`btn btn-xs py-0.5 px-2 rounded-end-pill ${
                          activeBranch === 1 ? 'text-white' : 'btn-light border'
                        }`}
                        style={{
                          backgroundColor: activeBranch === 1 ? 'var(--sa-primary, #8B1216)' : '#FAF8F5',
                          fontSize: '0.70rem',
                          fontWeight: 600
                        }}
                      >
                        Tarabai Park
                      </button>
                    </div>
                  </div>

                  {/* Clean address block with requested extra spacing */}
                  <div className="mt-2.5">
                    <span className="text-sa-charcoal small fw-semibold d-block" style={{ fontSize: '0.85rem' }}>
                      Shubham Academy ({currentCampus.name})
                    </span>
                    <p
                      className="text-sa-muted small m-0 mt-1.5"
                      style={{ fontSize: '0.81rem', lineHeight: '1.5' }}
                    >
                      {currentCampus.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Call Us */}
              <div className="d-flex align-items-start gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: '42px',
                    height: '42px',
                    backgroundColor: '#FAF3E7',
                    color: 'var(--sa-primary, #8B1216)'
                  }}
                >
                  <Phone size={20} />
                </div>
                <div>
                  <span className="fw-bold text-sa-charcoal d-block" style={{ fontSize: '0.94rem' }}>
                    Call Us
                  </span>
                  <a
                    href={`tel:${mainPhone}`}
                    className="fw-bold text-decoration-none d-block mt-1"
                    style={{ color: 'var(--sa-charcoal, #1E293B)', fontSize: '0.92rem' }}
                  >
                    {mainPhone}
                  </a>
                  <span className="text-sa-muted small d-block mt-0.5" style={{ fontSize: '0.78rem' }}>
                    (Mon – Sat, 8:30 AM – 7:00 PM)
                  </span>
                </div>
              </div>

              {/* 3. Email Us */}
              <div className="d-flex align-items-start gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: '42px',
                    height: '42px',
                    backgroundColor: '#FAF3E7',
                    color: 'var(--sa-primary, #8B1216)'
                  }}
                >
                  <Mail size={20} />
                </div>
                <div>
                  <span className="fw-bold text-sa-charcoal d-block" style={{ fontSize: '0.94rem' }}>
                    Email Us
                  </span>
                  <a
                    href={`mailto:${mainEmail}`}
                    className="text-decoration-none small fw-medium d-block mt-1"
                    style={{ color: 'var(--sa-charcoal, #1E293B)', fontSize: '0.88rem' }}
                  >
                    {mainEmail}
                  </a>
                  <span className="text-sa-muted small d-block mt-0.5" style={{ fontSize: '0.78rem' }}>
                    We usually respond within 24 hours.
                  </span>
                </div>
              </div>

              {/* 4. Office Hours */}
              <div className="d-flex align-items-start gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: '42px',
                    height: '42px',
                    backgroundColor: '#FAF3E7',
                    color: 'var(--sa-primary, #8B1216)'
                  }}
                >
                  <Clock size={20} />
                </div>
                <div>
                  <span className="fw-bold text-sa-charcoal d-block" style={{ fontSize: '0.94rem' }}>
                    Office Hours
                  </span>
                  <span className="text-sa-muted small d-block mt-1" style={{ fontSize: '0.84rem' }}>
                    Monday – Saturday
                  </span>
                  <span className="text-sa-muted small d-block" style={{ fontSize: '0.84rem' }}>
                    9:00 AM – 6:00 PM
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Send Us a Message */}
        <div className="col-12 col-lg-7">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-4 p-md-4.5 rounded-3 border h-100 d-flex flex-column justify-content-between shadow-sm"
            style={{ borderColor: 'var(--sa-border, #E2E8F0)' }}
          >
            <div>
              <h4
                className="brand-font fw-bold mb-1"
                style={{ color: 'var(--sa-primary, #8B1216)', fontSize: '1.25rem' }}
              >
                Send Us a Message
              </h4>
              <p className="text-sa-muted small mb-3.5" style={{ fontSize: '0.86rem' }}>
                Fill in the form below and we'll get back to you as soon as possible.
              </p>

              <div className="row g-3">
                {/* Full Name */}
                <div className="col-12 col-sm-6">
                  <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ fontSize: '0.88rem', padding: '0.625rem 0.85rem' }}
                    required
                  />
                </div>

                {/* Email Address */}
                <div className="col-12 col-sm-6">
                  <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ fontSize: '0.88rem', padding: '0.625rem 0.85rem' }}
                    required
                  />
                </div>

                {/* Subject */}
                <div className="col-12">
                  <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                    Subject <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    style={{ fontSize: '0.88rem', padding: '0.625rem 0.85rem' }}
                    required
                  >
                    <option value="">Select subject</option>
                    <option value="General Enquiry">General Enquiry</option>
                    <option value="Fees & Payment Query">Fees & Payment Query</option>
                    <option value="Notes & Study Materials">Notes & Study Materials</option>
                    <option value="Batch & Lecture Timing">Batch & Lecture Timing</option>
                    <option value="RFID Attendance & ID Card">RFID Attendance & ID Card</option>
                    <option value="Exam & Marks Clarification">Exam & Marks Clarification</option>
                  </select>
                </div>

                {/* Message */}
                <div className="col-12">
                  <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                    Message <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Type your message here..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{ fontSize: '0.88rem', padding: '0.625rem 0.85rem' }}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button matching amber/mustard style in user image */}
            <div className="mt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn w-100 py-2.5 rounded-2 d-flex align-items-center justify-content-center gap-2 fw-semibold text-white shadow-sm transition-all"
                style={{
                  backgroundColor: '#D97718',
                  borderColor: '#D97718',
                  fontSize: '0.94rem'
                }}
              >
                <Send size={16} />
                <span>{isSubmitting ? 'Sending Message...' : 'Send Message'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 3. Frequently Asked Questions (FAQ Section with extra requested spacing) */}
      <div className="bg-white p-4 p-md-4.5 rounded-3 border shadow-sm" style={{ borderColor: 'var(--sa-border, #E2E8F0)' }}>
        {/* FAQ Header with extra bottom margin for clean spacing */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4 pb-1">
          <div>
            <h4
              className="brand-font fw-bold m-0"
              style={{ color: 'var(--sa-primary, #8B1216)', fontSize: '1.25rem' }}
            >
              Frequently Asked Questions
            </h4>
            <p className="text-sa-muted small m-0 mt-1" style={{ fontSize: '0.86rem' }}>
              Find quick answers to common queries.
            </p>
          </div>
          <span
            className="small fw-semibold d-inline-flex align-items-center gap-1"
            style={{ color: 'var(--sa-primary, #8B1216)', cursor: 'default', fontSize: '0.82rem' }}
          >
            Quick Help Desk
          </span>
        </div>

        {/* 2-Column Grid of 6 FAQ Items */}
        <div className="row g-3">
          {faqs.map((faq) => {
            const Icon = faq.icon;
            const isOpen = openFaq === faq.id;
            return (
              <div key={faq.id} className="col-12 col-md-6">
                <div
                  className="rounded-3 border transition-all"
                  style={{
                    backgroundColor: isOpen ? '#FAF8F5' : '#FFFFFF',
                    borderColor: isOpen ? 'var(--sa-primary, #8B1216)' : '#E2E8F0',
                    boxShadow: isOpen ? '0 2px 8px rgba(139, 18, 22, 0.06)' : 'none'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className="w-100 btn text-start p-3 d-flex align-items-center justify-content-between border-0 shadow-none"
                    style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--sa-charcoal, #1E293B)' }}
                  >
                    <div className="d-flex align-items-center gap-2.5">
                      <div
                        className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: '28px',
                          height: '28px',
                          backgroundColor: '#FDF0F0',
                          color: 'var(--sa-primary, #8B1216)'
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <span>{faq.question}</span>
                    </div>
                    <ChevronDown
                      size={18}
                      className="text-muted flex-shrink-0 ms-2 transition-all"
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        color: isOpen ? 'var(--sa-primary, #8B1216)' : '#64748B'
                      }}
                    />
                  </button>

                  {/* Expandable answer */}
                  {isOpen && (
                    <div className="px-3 pb-3 pt-0 border-top mt-1" style={{ borderColor: '#E8E5DF' }}>
                      <p className="text-sa-muted small m-0 pt-2" style={{ fontSize: '0.82rem', lineHeight: '1.5' }}>
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Bottom Section: Embedded Google Map & "Our Location" Card */}
      <div
        className="bg-white rounded-3 border overflow-hidden shadow-sm"
        style={{ borderColor: 'var(--sa-border, #E2E8F0)' }}
      >
        <div className="row g-0 align-items-center">
          {/* Left: Embedded Google Map */}
          <div className="col-12 col-md-7 position-relative" style={{ minHeight: '235px' }}>
            <iframe
              title="Shubham Academy Location Map"
              src={currentCampus.embedMap}
              width="100%"
              height="235"
              style={{ border: 0, display: 'block' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {/* View larger map link on top left of map */}
            <a
              href={currentCampus.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="position-absolute top-0 start-0 m-2 btn btn-xs btn-white bg-white text-muted border shadow-sm py-1 px-2 d-flex align-items-center gap-1 text-decoration-none"
              style={{ fontSize: '0.72rem', zIndex: 2 }}
            >
              <span>View larger map</span>
              <ExternalLink size={11} />
            </a>
          </div>

          {/* Right: Location Details & "Get Directions" */}
          <div className="col-12 col-md-5 p-4 d-flex flex-column justify-content-between h-100">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#FDF0F0',
                    color: 'var(--sa-primary, #8B1216)'
                  }}
                >
                  <MapPin size={18} />
                </div>
                <h5
                  className="brand-font fw-bold m-0"
                  style={{ color: 'var(--sa-primary, #8B1216)', fontSize: '1.15rem' }}
                >
                  Our Location
                </h5>
              </div>

              {/* Campus Selector Pills with extra requested bottom space */}
              <div className="d-flex gap-2 mb-3.5 mt-2">
                {campuses.map((campus, idx) => (
                  <button
                    key={campus.id}
                    type="button"
                    onClick={() => setActiveBranch(idx)}
                    className={`btn btn-xs py-1 px-3 rounded-pill fw-semibold ${
                      activeBranch === idx ? 'text-white shadow-xs' : 'btn-light border'
                    }`}
                    style={{
                      backgroundColor: activeBranch === idx ? 'var(--sa-primary, #8B1216)' : '#FAF8F5',
                      fontSize: '0.75rem'
                    }}
                  >
                    {campus.shortName}
                  </button>
                ))}
              </div>

              {/* Location Address with clear spacing */}
              <div className="pt-1">
                <span className="fw-semibold text-sa-charcoal d-block small" style={{ fontSize: '0.86rem' }}>
                  Shubham Academy ({currentCampus.name})
                </span>
                <p className="text-sa-muted small m-0 mt-1.5" style={{ fontSize: '0.81rem', lineHeight: '1.5' }}>
                  {currentCampus.address}
                </p>
              </div>
            </div>

            {/* Action buttons: Get Directions & Copy */}
            <div className="d-flex align-items-center gap-2 mt-4 pt-2">
              <a
                href={currentCampus.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm d-flex align-items-center justify-content-center gap-1.5 py-2 px-3 fw-semibold text-decoration-none shadow-sm flex-grow-1"
                style={{
                  backgroundColor: '#FDF0F0',
                  color: 'var(--sa-primary, #8B1216)',
                  border: '1px solid #F0C4C6',
                  fontSize: '0.84rem'
                }}
              >
                <Navigation size={15} />
                <span>Get Directions</span>
              </a>

              <button
                type="button"
                onClick={() => handleCopyAddress(currentCampus.address)}
                className="btn btn-sm btn-light border py-2 px-2.5 d-flex align-items-center gap-1 text-muted"
                style={{ fontSize: '0.80rem' }}
                title="Copy address"
              >
                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
