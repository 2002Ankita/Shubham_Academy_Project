import React from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { BookMarked, Download, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import materialService from '../../services/materialService';
import useAuth from '../../hooks/useAuth';
import { useState, useEffect } from 'react';

export default function StudentStudyMaterials() {
  const [materials, setMaterials] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const data = await materialService.getMaterials();
      // Optional: Filter by student course if data was available on user object
      setMaterials(data);
    } catch (err) {
      toast.error('Failed to load study materials');
    }
  };

  const handleDownload = async (item) => {
    try {
      toast.info(`Downloading "${item.title}"...`);
      await materialService.downloadMaterial(item.id, item.title);
      toast.success('Download complete');
    } catch (err) {
      toast.error('Failed to download file');
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
          Course Study Materials & Notes
        </h3>
        <span className="small text-sa-muted">
          Download faculty-curated lecture slides, formula summaries, and revision guides
        </span>
      </div>

      <div className="sa-card p-4">
        <Table
          columns={[
            {
              key: 'title',
              title: 'Resource Title',
              render: (val) => (
                <div className="d-flex align-items-center gap-2">
                  <FileText size={18} className="text-sa-primary" />
                  <span className="fw-semibold text-sa-charcoal">{val}</span>
                </div>
              )
            },
            { key: 'subject', title: 'Subject', render: (val) => <span className="badge bg-light text-dark border">{val}</span> },
            { key: 'teacherName', title: 'Faculty' },
            { key: 'fileType', title: 'Type' },
            { key: 'size', title: 'Size' },
            { key: 'uploadDate', title: 'Uploaded' },
            {
              key: 'id',
              title: 'Action',
              align: 'end',
              render: (val, item) => (
                <Button
                  size="sm"
                  variant="outline"
                  icon={Download}
                  onClick={() => handleDownload(item)}
                >
                  Download
                </Button>
              )
            }
          ]}
          data={materials}
        />
      </div>
    </div>
  );
}
