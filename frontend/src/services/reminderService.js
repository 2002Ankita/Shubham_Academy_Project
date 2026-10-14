import api from './api';

export const reminderService = {
  getSettings: async () => {
    try {
      const res = await api.get('/reminders/settings');
      return res.data;
    } catch (error) {
      console.warn('Using default reminder settings:', error);
      return {
        academy: 'Default',
        enabled: true,
        channel: 'WhatsApp',
        remind_days_before: 3,
        remind_on_due_date: true,
        remind_days_after: 7,
        retry_limit: 3,
        message_template: 'Dear {parent_name}, this is a friendly reminder that an outstanding tuition fee of ₹{pending_fees} for {student_name} is due on {due_date}. Please ignore if already paid.'
      };
    }
  },

  updateSettings: async (settingsData) => {
    try {
      const res = await api.put('/reminders/settings', settingsData);
      return res.data;
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      throw error;
    }
  },

  getHistory: async (params = {}) => {
    try {
      const res = await api.get('/reminders/history', { params });
      return res.data;
    } catch (error) {
      console.warn('Error fetching reminder history:', error);
      return [];
    }
  },

  triggerManual: async (studentId) => {
    try {
      const res = await api.post('/reminders/manual', { student_id: studentId });
      return res.data;
    } catch (error) {
      console.error('Error triggering manual reminder:', error);
      throw error;
    }
  },

  runSchedulerNow: async () => {
    try {
      const res = await api.post('/reminders/run-scheduler-now');
      return res.data;
    } catch (error) {
      console.error('Error running scheduler:', error);
      throw error;
    }
  }
};

export default reminderService;
