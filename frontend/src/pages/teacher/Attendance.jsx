import React, { useState, useEffect } from 'react';
import studentService from '../../services/studentService';
import { toast } from 'react-toastify';
import { Save, Users, CheckCircle2, XCircle } from 'lucide-react';

export default function TeacherAttendance() {
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [selectedBatch, setSelectedBatch] = useState('12th Science - Alpha');

  useEffect(() => {
    const fetchStudents = async () => {
      const data = await studentService.getAll();
      setStudents(data);
      const initialMap = {};
      data.forEach(s => { initialMap[s.id] = 'Present'; });
      setAttendanceMap(initialMap);
    };
    fetchStudents();
  }, []);

  const toggleStatus = (id) => {
    setAttendanceMap(prev => ({
      ...prev,
      [id]: prev[id] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  const handleSave = () => {
    toast.success(`Attendance submitted for ${selectedBatch}!`);
  };

  // Compute real attendance numbers from current roll call
  const presentCount = Object.values(attendanceMap).filter(status => status === 'Present').length;
  const absentCount = students.length - presentCount;
  const attendanceRate = students.length > 0 ? ((presentCount / students.length) * 100).toFixed(0) : 100;

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '22px' }}>
      {/* 1. TOP HEADER & ACTION AREA */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 pt-1">
        {/* Left: Title & Subtitle */}
        <div>
          <h1 className="fw-bold brand-font text-sa-charcoal m-0" style={{ fontSize: '22px', lineHeight: 1.25 }}>
            Classroom Attendance Register
          </h1>
          <p className="text-sa-muted m-0 mt-1" style={{ fontSize: '13.5px' }}>
            Mark daily classroom or laboratory roll call
          </p>
        </div>

        {/* Right: Controls & Actions */}
        <div className="d-flex align-items-center flex-wrap" style={{ gap: '18px' }}>
          {/* Class / Batch Selector */}
          <div style={{ width: '220px' }}>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="form-select"
              style={{
                height: '42px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E1E6ED',
                borderRadius: '10px',
                fontSize: '13.5px',
                fontWeight: 500,
                color: '#1E293B',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                cursor: 'pointer',
                paddingLeft: '14px',
                paddingRight: '32px'
              }}
            >
              <option value="12th Science - Alpha">12th Science - Alpha</option>
              <option value="11th Science - Beta">11th Science - Beta</option>
              <option value="12th Commerce - Gamma">12th Commerce - Gamma</option>
              <option value="10th Foundation">10th Foundation</option>
              <option value="NEET Intensive">NEET Intensive</option>
            </select>
          </div>

          {/* Save Roll Call Button */}
          <button
            onClick={handleSave}
            className="btn d-inline-flex align-items-center justify-content-center gap-2 text-white border-0 transition-all shadow-xs"
            style={{
              height: '42px',
              backgroundColor: 'var(--sa-primary-red)',
              borderRadius: '10px',
              padding: '0 20px',
              fontSize: '13.5px',
              fontWeight: 600,
              letterSpacing: '0.01em',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#6E0B0F';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--sa-primary-red)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Save size={16} className="text-white" />
            <span>Save Roll Call</span>
          </button>
        </div>
      </div>

      {/* 2. COMPACT ATTENDANCE SUMMARY PILLS */}
      <div className="d-flex align-items-center gap-3 flex-wrap">
        <div
          className="d-flex align-items-center gap-2 px-3 py-2 bg-white rounded-3 border"
          style={{ borderColor: '#E1E6ED', height: '42px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
        >
          <Users size={16} className="text-sa-muted" />
          <span className="text-sa-muted" style={{ fontSize: '12.5px', fontWeight: 500 }}>Total Students:</span>
          <span className="fw-bold text-sa-charcoal" style={{ fontSize: '14px' }}>{students.length}</span>
        </div>

        <div
          className="d-flex align-items-center gap-2 px-3 py-2 bg-white rounded-3 border"
          style={{ borderColor: '#E1E6ED', height: '42px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
        >
          <CheckCircle2 size={16} style={{ color: '#168554' }} />
          <span className="text-sa-muted" style={{ fontSize: '12.5px', fontWeight: 500 }}>Present:</span>
          <span className="fw-bold text-success" style={{ fontSize: '14px' }}>{presentCount}</span>
          <span
            className="badge rounded-pill fw-semibold ms-1"
            style={{ backgroundColor: '#EAF6EF', color: '#168554', fontSize: '11px', padding: '3px 8px' }}
          >
            {attendanceRate}%
          </span>
        </div>

        <div
          className="d-flex align-items-center gap-2 px-3 py-2 bg-white rounded-3 border"
          style={{ borderColor: '#E1E6ED', height: '42px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
        >
          <XCircle size={16} style={{ color: '#A91D22' }} />
          <span className="text-sa-muted" style={{ fontSize: '12.5px', fontWeight: 500 }}>Absent:</span>
          <span className="fw-bold text-danger" style={{ fontSize: '14px' }}>{absentCount}</span>
        </div>
      </div>

      {/* 3. MAIN ATTENDANCE CARD */}
      <div
        className="sa-card bg-white rounded-4 border"
        style={{
          borderColor: '#E1E6ED',
          borderRadius: '16px',
          padding: '20px 24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div className="table-responsive">
          <table className="table m-0 align-middle">
            <thead>
              <tr style={{ height: '48px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th
                  style={{
                    width: '20%',
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: '#1E293B',
                    textTransform: 'uppercase',
                    paddingLeft: '16px',
                    borderTop: 'none',
                    verticalAlign: 'middle'
                  }}
                >
                  ROLL NO.
                </th>
                <th
                  style={{
                    width: '25%',
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: '#1E293B',
                    textTransform: 'uppercase',
                    borderTop: 'none',
                    verticalAlign: 'middle'
                  }}
                >
                  STUDENT NAME
                </th>
                <th
                  style={{
                    width: '20%',
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: '#1E293B',
                    textTransform: 'uppercase',
                    borderTop: 'none',
                    verticalAlign: 'middle'
                  }}
                >
                  STANDARD
                </th>
                <th
                  style={{
                    width: '15%',
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: '#1E293B',
                    textTransform: 'uppercase',
                    borderTop: 'none',
                    verticalAlign: 'middle'
                  }}
                >
                  STATUS
                </th>
                <th
                  style={{
                    width: '20%',
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: '#1E293B',
                    textTransform: 'uppercase',
                    textAlign: 'right',
                    paddingRight: '16px',
                    borderTop: 'none',
                    verticalAlign: 'middle'
                  }}
                >
                  TOGGLE ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const isPresent = (attendanceMap[student.id] || 'Present') === 'Present';
                return (
                  <tr
                    key={student.id}
                    className="transition-all"
                    style={{
                      height: '66px',
                      borderBottom: '1px solid #F1F5F9',
                      backgroundColor: '#FFFFFF'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFFBFB'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                  >
                    {/* Roll No. */}
                    <td style={{ paddingLeft: '16px', verticalAlign: 'middle' }}>
                      <span className="fw-bold" style={{ color: 'var(--sa-primary-red)', fontSize: '13.5px', letterSpacing: '0.01em' }}>
                        {student.rollNumber}
                      </span>
                    </td>

                    {/* Student Name */}
                    <td style={{ verticalAlign: 'middle' }}>
                      <div className="fw-semibold text-sa-charcoal" style={{ fontSize: '14px' }}>
                        {student.name}
                      </div>
                    </td>

                    {/* Standard */}
                    <td style={{ verticalAlign: 'middle' }}>
                      <span className="text-sa-muted" style={{ fontSize: '13.5px' }}>
                        {student.standard}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td style={{ verticalAlign: 'middle' }}>
                      {isPresent ? (
                        <span
                          className="d-inline-flex align-items-center justify-content-center"
                          style={{
                            backgroundColor: '#EAF6EF',
                            color: '#168554',
                            border: '1px solid #C6E7D2',
                            borderRadius: '20px',
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            letterSpacing: '0.02em'
                          }}
                        >
                          Present
                        </span>
                      ) : (
                        <span
                          className="d-inline-flex align-items-center justify-content-center"
                          style={{
                            backgroundColor: '#FDF0F0',
                            color: '#A91D22',
                            border: '1px solid #F8C6C8',
                            borderRadius: '20px',
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            letterSpacing: '0.02em'
                          }}
                        >
                          Absent
                        </span>
                      )}
                    </td>

                    {/* Toggle Action Button */}
                    <td style={{ textAlign: 'right', paddingRight: '16px', verticalAlign: 'middle' }}>
                      {isPresent ? (
                        <button
                          type="button"
                          onClick={() => toggleStatus(student.id)}
                          className="btn transition-all"
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #FCA5A5',
                            color: '#A91D22',
                            borderRadius: '8px',
                            padding: '6px 14px',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#FDF0F0';
                            e.currentTarget.style.borderColor = '#A91D22';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                            e.currentTarget.style.borderColor = '#FCA5A5';
                          }}
                        >
                          Mark Absent
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleStatus(student.id)}
                          className="btn transition-all"
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #86EFAC',
                            color: '#168554',
                            borderRadius: '8px',
                            padding: '6px 14px',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#EAF6EF';
                            e.currentTarget.style.borderColor = '#168554';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                            e.currentTarget.style.borderColor = '#86EFAC';
                          }}
                        >
                          Mark Present
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
