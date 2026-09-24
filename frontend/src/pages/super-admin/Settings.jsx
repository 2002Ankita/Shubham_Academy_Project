import React, { useState } from 'react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { toast } from 'react-toastify';
import { Save, Server, Key, Bell, Database } from 'lucide-react';

export default function SuperAdminSettings() {
  const [settings, setSettings] = useState({
    fastApiUrl: 'http://localhost:8000/api',
    jwtExpiryMinutes: '1440',
    smsGatewayKey: 'sms_live_pk_9842100877a',
    rfidGatewayIp: '192.168.1.100:8080',
    autoBackupEnabled: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('System settings saved successfully!');
  };

  return (
    <div className="d-flex flex-column gap-4" style={{ maxWidth: '800px' }}>
      <div>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">Platform Settings</h3>
        <span className="small text-sa-muted">Configure backend API endpoints, hardware bridges, and security tokens</span>
      </div>

      <form onSubmit={handleSave} className="sa-card p-4 d-flex flex-column gap-4">
        {/* API Bridge */}
        <div>
          <h6 className="fw-bold text-sa-charcoal d-flex align-items-center gap-2 mb-3">
            <Server size={18} className="text-sa-primary" />
            FastAPI Backend Connection
          </h6>
          <div className="row g-3">
            <div className="col-12 col-md-8">
              <Input
                label="API Endpoint URL"
                name="fastApiUrl"
                value={settings.fastApiUrl}
                onChange={(e) => setSettings({ ...settings, fastApiUrl: e.target.value })}
                helperText="Active FastAPI microservices base URL"
                required
              />
            </div>
            <div className="col-12 col-md-4">
              <Input
                label="JWT Expiry (Minutes)"
                name="jwtExpiryMinutes"
                type="number"
                value={settings.jwtExpiryMinutes}
                onChange={(e) => setSettings({ ...settings, jwtExpiryMinutes: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        <hr className="my-1 text-muted opacity-25" />

        {/* Hardware & Integrations */}
        <div>
          <h6 className="fw-bold text-sa-charcoal d-flex align-items-center gap-2 mb-3">
            <Bell size={18} className="text-sa-primary" />
            Hardware & SMS Integrations
          </h6>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <Input
                label="RFID Sensor Gate Gateway IP"
                name="rfidGatewayIp"
                value={settings.rfidGatewayIp}
                onChange={(e) => setSettings({ ...settings, rfidGatewayIp: e.target.value })}
                helperText="Local hardware broker address"
                required
              />
            </div>
            <div className="col-12 col-md-6">
              <Input
                label="Parent SMS Gateway API Secret"
                name="smsGatewayKey"
                type="password"
                value={settings.smsGatewayKey}
                onChange={(e) => setSettings({ ...settings, smsGatewayKey: e.target.value })}
                helperText="Used for automated gate-scan alerts"
                required
              />
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end pt-2 border-top">
          <Button type="submit" variant="primary" icon={Save}>
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
}
