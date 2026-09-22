import React, { useState } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { Building2, Plus, MapPin, Phone, Mail } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Academies() {
  const [academies, setAcademies] = useState([
    { id: 'AC-01', name: 'Pune Main Campus', location: 'Kothrud, Pune', contact: '+91 98220 00111', email: 'kothrud@shubham.edu', principal: 'Rajesh Patil', active: true },
    { id: 'AC-02', name: 'Baner Tech Hub', location: 'Baner Road, Pune', contact: '+91 98220 00222', email: 'baner@shubham.edu', principal: 'Dr. Vivek Kulkarni', active: true },
    { id: 'AC-03', name: 'Viman Nagar Extension', location: 'Symbiosis Road, Pune', contact: '+91 98220 00333', email: 'vimannagar@shubham.edu', principal: 'Mrs. Sunita Deshmukh', active: true },
    { id: 'AC-04', name: 'PCMC Nigdi Campus', location: 'Sector 24, Nigdi', contact: '+91 98220 00444', email: 'pcmc@shubham.edu', principal: 'Prof. Anup Shinde', active: true },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [newAcademy, setNewAcademy] = useState({ name: '', location: '', contact: '', email: '', principal: '' });

  const handleCreate = (e) => {
    e.preventDefault();
    const item = {
      ...newAcademy,
      id: `AC-0${academies.length + 1}`,
      active: true
    };
    setAcademies([...academies, item]);
    toast.success(`Academy campus "${newAcademy.name}" created!`);
    setModalOpen(false);
    setNewAcademy({ name: '', location: '', contact: '', email: '', principal: '' });
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">Academy Branches</h3>
          <span className="small text-sa-muted">Manage affiliated institutions, branches, and centers</span>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>
          Add New Academy Branch
        </Button>
      </div>

      <div className="sa-card p-4">
        <Table
          columns={[
            { key: 'id', title: 'Code', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'name', title: 'Campus Name' },
            { key: 'location', title: 'Location', render: (val) => <span className="d-flex align-items-center gap-1"><MapPin size={14} className="text-sa-primary" />{val}</span> },
            { key: 'principal', title: 'Branch Head' },
            { key: 'contact', title: 'Contact No.' },
            { key: 'email', title: 'Official Email' },
            {
              key: 'active',
              title: 'Status',
              render: (val) => val ? <span className="badge-active">Operational</span> : <span className="badge-pending">Inactive</span>
            }
          ]}
          data={academies}
        />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register New Academy Campus">
        <form onSubmit={handleCreate}>
          <Input
            label="Campus Name"
            name="name"
            placeholder="e.g. Hadapsar Science Center"
            value={newAcademy.name}
            onChange={(e) => setNewAcademy({ ...newAcademy, name: e.target.value })}
            required
          />
          <Input
            label="Location"
            name="location"
            placeholder="e.g. Magarpatta Road, Hadapsar, Pune"
            value={newAcademy.location}
            onChange={(e) => setNewAcademy({ ...newAcademy, location: e.target.value })}
            required
          />
          <Input
            label="Branch Head / Principal"
            name="principal"
            placeholder="e.g. Dr. Ramesh Jadhav"
            value={newAcademy.principal}
            onChange={(e) => setNewAcademy({ ...newAcademy, principal: e.target.value })}
            required
          />
          <div className="row g-2">
            <div className="col-6">
              <Input
                label="Contact Number"
                name="contact"
                placeholder="+91 98220 XXXXX"
                value={newAcademy.contact}
                onChange={(e) => setNewAcademy({ ...newAcademy, contact: e.target.value })}
                required
              />
            </div>
            <div className="col-6">
              <Input
                label="Official Email"
                name="email"
                type="email"
                placeholder="hadapsar@shubham.edu"
                value={newAcademy.email}
                onChange={(e) => setNewAcademy({ ...newAcademy, email: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Branch</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
