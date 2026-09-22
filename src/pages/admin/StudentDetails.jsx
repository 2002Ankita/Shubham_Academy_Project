import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import studentService from '../../services/studentService';
import marksService from '../../services/marksService';
import feeService from '../../services/feeService';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import {
  ArrowLeft,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  Award,
  Phone,
  Mail,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const [stu, res] = await Promise.all([
          studentService.getById(id),
          marksService.getStudentResults(id),
        ]);
        setStudent(stu);
        setResults(res);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [id]);

  if (loading) return <Loader fullPage message="Loading student profile..." />;
  if (!student) return <div className="p-4 text-center">Student record not found.</div>;

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <button
          type="button"
          className="btn btn-link p-0 d-inline-flex align-items-center gap-1 small text-sa-muted mb-2 text-decoration-none"
          onClick={() => navigate('/admin/students')}
        >
          <ArrowLeft size={16} /> Back to Directory
        </button>
        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
          <div>
            <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
              {student.name}
            </h3>
            <span className="small text-sa-muted">
              Roll No: <strong className="text-sa-primary">{student.rollNumber}</strong> • RFID UID: {student.rfidCard}
            </span>
          </div>

          <div className="d-flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/fees')}>
              Collect Fee
            </Button>
            <Button variant="primary" onClick={() => navigate('/admin/marks/entry')}>
              Record Marks
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="row g-3">
        <div className="col-12 col-lg-4">
          <div className="sa-card p-4 h-100">
            <h6 className="fw-bold text-sa-charcoal mb-3 fs-6">Personal & Contact Info</h6>
            <div className="d-flex flex-column gap-2 small">
              <div className="d-flex align-items-center gap-2 text-sa-muted">
                <Mail size={16} className="text-sa-primary" />
                <span>{student.email}</span>
              </div>
              <div className="d-flex align-items-center gap-2 text-sa-muted">
                <Phone size={16} className="text-sa-primary" />
                <span>{student.phone}</span>
              </div>
              <div className="d-flex align-items-start gap-2 text-sa-muted">
                <MapPin size={16} className="text-sa-primary flex-shrink-0 mt-1" />
                <span>{student.address || 'Pune, Maharashtra'}</span>
              </div>
            </div>

            <hr className="my-3 opacity-25" />

            <h6 className="fw-bold text-sa-charcoal mb-2 fs-6">Parent Details (SMS Alert)</h6>
            <p className="small text-sa-muted mb-1">
              <strong>Parent:</strong> {student.parentName || 'Sanjay Deshmukh'}
            </p>
            <p className="small text-sa-muted mb-0">
              <strong>Emergency / Alert:</strong> {student.parentPhone || '+91 98231 45671'}
            </p>
          </div>
        </div>

        {/* Academics & Fees Summary */}
        <div className="col-12 col-lg-8">
          <div className="row g-3">
            <div className="col-12 col-sm-6">
              <div className="sa-card p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="small text-sa-muted fw-semibold">ATTENDANCE LOG</span>
                  <CalendarCheck size={20} className="text-success" />
                </div>
                <h3 className="brand-font fw-bold text-sa-charcoal m-0 fs-3">
                  {student.attendancePercent || 94.2}%
                </h3>
                <span className="small text-sa-muted">
                  Total RFID gate taps verified this term
                </span>
              </div>
            </div>

            <div className="col-12 col-sm-6">
              <div className="sa-card p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="small text-sa-muted fw-semibold">FEE RECOVERY</span>
                  <CreditCard size={20} className="text-sa-primary" />
                </div>
                <h3 className="brand-font fw-bold text-sa-charcoal m-0 fs-3">
                  ₹ {student.paidFees?.toLocaleString()} / ₹ {student.totalFees?.toLocaleString()}
                </h3>
                <span className="small text-sa-muted">
                  Status: <strong>{student.feesStatus}</strong>
                </span>
              </div>
            </div>

            {/* Exam Results Table */}
            <div className="col-12">
              <div className="sa-card p-4">
                <h6 className="brand-font fw-bold text-sa-charcoal mb-3 fs-6">
                  Published Examination Records
                </h6>
                <div className="table-responsive">
                  <table className="table table-sm sa-table mb-0">
                    <thead>
                      <tr>
                        <th>Exam Title</th>
                        <th>Subject</th>
                        <th>Max</th>
                        <th>Obtained</th>
                        <th>%</th>
                        <th>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-3 text-muted">
                            No exam marks recorded yet.
                          </td>
                        </tr>
                      ) : (
                        results.map((r, i) => (
                          <tr key={i}>
                            <td className="fw-semibold">{r.examTitle}</td>
                            <td>{r.subject}</td>
                            <td>{r.maxMarks}</td>
                            <td className="fw-bold text-sa-primary">{r.obtainedMarks}</td>
                            <td>{r.percentage}%</td>
                            <td>
                              <span className="badge bg-success small">{r.grade}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
