// Initial Teacher Leave Balance and History Data

export const initialLeaveBalance = {
  available: 12,
  used: 8,
  pending: 1,
  totalAnnual: 20,
  casualAvailable: 5,
  sickAvailable: 4,
  earnedAvailable: 3
};

export const initialLeaveRequests = [
  {
    id: 'LR-2026-004',
    leaveType: 'Casual Leave',
    fromDate: '2026-09-28',
    toDate: '2026-09-29',
    days: 2,
    reason: 'Attending sibling marriage ceremony in Pune.',
    appliedDate: '24 Sep 2026',
    status: 'Pending',
    adminComment: 'Under review by Academic Coordinator.',
    attachmentName: null
  },
  {
    id: 'LR-2026-003',
    leaveType: 'Sick Leave',
    fromDate: '2026-09-12',
    toDate: '2026-09-13',
    days: 2,
    reason: 'Viral fever and prescribed medical rest by family physician.',
    appliedDate: '11 Sep 2026',
    status: 'Approved',
    adminComment: 'Approved. Syllabus proxy assigned to Prof. Amit Sawant.',
    attachmentName: 'medical_certificate.pdf'
  },
  {
    id: 'LR-2026-002',
    leaveType: 'Casual Leave',
    fromDate: '2026-08-18',
    toDate: '2026-08-18',
    days: 1,
    reason: 'Personal administrative bank documentation work.',
    appliedDate: '16 Aug 2026',
    status: 'Approved',
    adminComment: 'Approved. Classes rescheduled for morning slots.',
    attachmentName: null
  },
  {
    id: 'LR-2026-001',
    leaveType: 'Earned Leave',
    fromDate: '2026-07-10',
    toDate: '2026-07-14',
    days: 5,
    reason: 'Attending national level Physics Educators Seminar in Bangalore.',
    appliedDate: '01 Jul 2026',
    status: 'Approved',
    adminComment: 'Approved under Continuous Professional Development quota.',
    attachmentName: 'conference_invite.pdf'
  },
  {
    id: 'LR-2026-000',
    leaveType: 'Casual Leave',
    fromDate: '2026-06-20',
    toDate: '2026-06-22',
    days: 3,
    reason: 'Family emergency out of town.',
    appliedDate: '19 Jun 2026',
    status: 'Rejected',
    adminComment: 'Unit test invigilation schedule clashes; please reschedule.',
    attachmentName: null
  }
];

export const leaveTypes = [
  'Casual Leave',
  'Sick Leave',
  'Earned Leave',
  'Emergency Leave',
  'Other'
];
