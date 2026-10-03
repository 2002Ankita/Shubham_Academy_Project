import api from './api';

export const materialService = {
  uploadMaterial: async (formData) => {
    const res = await api.post('/materials', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  
  getMaterials: async () => {
    const res = await api.get('/materials');
    return res.data;
  },

  downloadMaterial: async (id, title) => {
    const res = await api.get(`/materials/${id}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    let filename = title;
    const contentDisposition = res.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch.length === 2) {
        filename = filenameMatch[1];
      }
    } else {
      // Fallback
    }

    if (!filename.includes('.')) {
      if (res.data.type === 'application/pdf') {
        filename += '.pdf';
      } else {
        filename += '.pdf'; // Default fallback
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};

export default materialService;
