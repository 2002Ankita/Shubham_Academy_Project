import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import studentService from '../../services/studentService';
import { toast } from 'react-toastify';
import { Check, X, Save } from 'lucide-react';

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

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Classroom Attendance Register
          </h3>
          <span className="small text-sa-muted">
            Mark daily classroom or laboratory roll call
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Select
            name="batch"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            options={['12th Science - Alpha', '11th Science - Beta', 'NEET Intensive']}
            className="m-0"
          />
          <Button variant="primary" icon={Save} onClick={handleSave}>
            Save Roll Call
          </Button>
        </div>
      </div>

      <div className="sa-card p-4">
        <Table
          columns={[
            { key: 'rollNumber', title: 'Roll No.', render: (val) => <span className="fw-bold text-sa-primary">{val}</span> },
            { key: 'name', title: 'Student Name' },
            { key: 'standard', title: 'Standard' },
            {
              key: 'id',
              title: 'Status',
              render: (val) => {
                const status = attendanceMap[val] || 'Present';
                return (
                  <span className={status === 'Present' ? 'badge-present' : 'badge-absent'}>
                    {status}
                  </span>
                );
              }
            },
            {
              key: 'id',
              title: 'Toggle Action',
              align: 'end',
              render: (val) => {
                const isPresent = attendanceMap[val] === 'Present';
                return (
                  <Button
                    size="sm"
                    variant={isPresent ? 'danger' : 'primary'}
                    onClick={() => toggleStatus(val)}
                  >
                    Mark {isPresent ? 'Absent' : 'Present'}
                  </Button>
                );
              }
            }
          ]}
          data={students}
        />
      </div>
    </div>
  );
}
