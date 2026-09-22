import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { User, Mail, Phone, GraduationCap, MapPin, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function StudentProfile() {
  const { user } = useAuth();

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Student profile updated!');
  };

  return (
    <div className="d-flex flex-column gap-4" style={{ maxWidth: '800px' }}>
      <div>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
          Student Profile
        </h3>
        <span className="small text-sa-muted">
          Your enrolled batch, registered RFID smart badge, and parent details
        </span>
      </div>

      <div className="sa-card p-4">
        <div className="d-flex align-items-center gap-4 pb-4 border-bottom mb-4">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'}
            alt="Profile"
            className="rounded-circle border"
            style={{ width: '80px', height: '80px', objectFit: 'cover' }}
          />
          <div>
            <h4 className="brand-font fw-bold m-0 text-sa-charcoal">{user?.name || 'Aarav Deshmukh'}</h4>
            <span className="text-sa-primary fw-semibold small d-block mb-1">
              Roll No: SA-2026-1042 • Class 12th Science
            </span>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-success small">Active Student</span>
              <span className="badge bg-light text-dark border small">RFID: RFID-984210</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <Input
                label="Student Full Name"
                name="name"
                defaultValue={user?.name || 'Aarav Deshmukh'}
                icon={User}
                disabled
              />
            </div>

            <div className="col-12 col-md-6">
              <Input
                label="Student Email Address"
                name="email"
                defaultValue={user?.email || 'aarav.d@shubham.edu'}
                icon={Mail}
                disabled
              />
            </div>

            <div className="col-12 col-md-6">
              <Input
                label="Student Phone"
                name="phone"
                defaultValue="+91 98231 45670"
                icon={Phone}
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <Input
                label="Class & Batch"
                name="standard"
                defaultValue="12th Science (Batch Alpha - Morning)"
                icon={GraduationCap}
                disabled
              />
            </div>

            <div className="col-12 col-md-6">
              <Input
                label="Parent / Guardian Name"
                name="parentName"
                defaultValue="Sanjay Deshmukh"
                disabled
              />
            </div>

            <div className="col-12 col-md-6">
              <Input
                label="Parent Alert Phone (RFID SMS)"
                name="parentPhone"
                defaultValue="+91 98231 45671"
                disabled
              />
            </div>

            <div className="col-12">
              <Input
                label="Residential Address"
                name="address"
                defaultValue="Flat 402, Green Park, Kothrud, Pune - 411038"
                icon={MapPin}
                required
              />
            </div>
          </div>

          <div className="d-flex justify-content-end mt-4 pt-3 border-top">
            <Button type="submit" variant="primary">
              Save Contact Updates
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
