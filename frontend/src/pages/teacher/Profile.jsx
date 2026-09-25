import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { User, Mail, Phone, BookOpen, Award, CheckCircle, Camera } from 'lucide-react';
import { toast } from 'react-toastify';

export default function TeacherProfile() {
  const { user, updateUser } = useAuth();
  const [avatar, setAvatar] = useState(
    user?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  );

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file (PNG, JPG, WEBP).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatarUrl = reader.result;
        setAvatar(newAvatarUrl);
        if (updateUser) {
          updateUser({ avatar: newAvatarUrl });
        }
        toast.success('Profile photo updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedData = {
      name: formData.get('name') || user?.name,
      phone: formData.get('phone'),
      qualification: formData.get('qualification'),
      avatar: avatar
    };
    if (updateUser) {
      updateUser(updatedData);
    }
    toast.success('Faculty profile details saved!');
  };

  return (
    <div className="d-flex flex-column gap-4" style={{ maxWidth: '800px' }}>
      <div>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
          Faculty Profile
        </h3>
        <span className="small text-sa-muted">
          Your credentials, contact information, and teaching portfolio
        </span>
      </div>

      <div className="sa-card p-4">
        <div className="d-flex align-items-center gap-4 pb-4 border-bottom mb-4">
          {/* Avatar with Camera upload badge button */}
          <div className="position-relative flex-shrink-0">
            <img
              src={avatar}
              alt="Profile"
              className="rounded-circle border shadow-sm object-fit-cover"
              style={{ width: '84px', height: '84px', borderColor: 'var(--sa-border)' }}
            />
            <label
              htmlFor="teacher-avatar-upload"
              className="position-absolute bottom-0 end-0 bg-white rounded-circle shadow border d-flex align-items-center justify-content-center cursor-pointer transition-all"
              style={{
                width: '30px',
                height: '30px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
              }}
              title="Change Profile Photo"
            >
              <Camera size={15} className="text-sa-primary" />
              <input
                id="teacher-avatar-upload"
                type="file"
                accept="image/*"
                className="d-none"
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          <div>
            <h4 className="brand-font fw-bold m-0 text-sa-charcoal">{user?.name || 'Dr. Priya Kulkarni'}</h4>
            <span className="text-sa-primary fw-semibold small d-block mb-1">
              Senior Faculty • Physics & Applied Mechanics
            </span>
            <span className="badge bg-success small">Verified Faculty Account</span>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <Input
                label="Full Name"
                name="name"
                defaultValue={user?.name || 'Dr. Priya Kulkarni'}
                icon={User}
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <Input
                label="Registered Email"
                name="email"
                defaultValue={user?.email || 'priya.k@shubham.edu'}
                icon={Mail}
                disabled
              />
            </div>

            <div className="col-12 col-md-6">
              <Input
                label="Phone Number"
                name="phone"
                defaultValue={user?.phone || '+91 98220 11223'}
                icon={Phone}
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <Input
                label="Qualification"
                name="qualification"
                defaultValue={user?.qualification || 'Ph.D in Applied Physics, B.Ed'}
                icon={Award}
                required
              />
            </div>

            <div className="col-12">
              <Input
                label="Department & Subject Domain"
                name="department"
                defaultValue="Department of Science & Mathematics (Physics Lead)"
                icon={BookOpen}
                disabled
              />
            </div>
          </div>

          <div className="d-flex justify-content-end mt-4 pt-3 border-top">
            <Button type="submit" variant="primary">
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
