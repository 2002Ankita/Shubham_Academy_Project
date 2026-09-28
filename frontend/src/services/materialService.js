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
    // Attempt to extract extension from title if present, otherwise just use title
    link.setAttribute('download', title);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};

export default materialService;
