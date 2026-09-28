export const incidentStatuses = ['Reported', 'Received', 'Verified', 'Responder Assigned', 'Responding', 'Arrived', 'Resolved', 'Cancelled']

export const incidents = [
  {
    id: 'ACC-2024-0520941',
    date: '24 Sep 2024, 18:42',
    shortDate: '24 Sep 2024',
    location: 'Sector 12, Chandigarh',
    type: 'Vehicle collision',
    description: 'Two vehicles were involved in a low-speed collision near the main crossing.',
    status: 'Reported',
    peopleInvolved: '2',
    injuries: 'Unknown',
    vehicles: 'Car',
    demo: true,
    timeline: [
      { status: 'Reported', time: '18:42', note: 'Report submitted in demo mode.' },
      { status: 'Received', time: '18:42', note: 'Demo platform received the report.' }
    ],
    updates: ['This is sample incident history for the frontend.']
  },
  {
    id: 'ACC-2024-0418732',
    date: '12 Aug 2024, 09:16',
    shortDate: '12 Aug 2024',
    location: 'Industrial Area Phase 2, Chandigarh',
    type: 'Single vehicle accident',
    description: 'A motorcycle slid on a wet road. No confirmed injuries were recorded in this demo.',
    status: 'Resolved',
    peopleInvolved: '1',
    injuries: 'No',
    vehicles: 'Motorcycle',
    demo: true,
    timeline: [
      { status: 'Reported', time: '09:16', note: 'Report created in demo mode.' },
      { status: 'Verified', time: '09:20', note: 'Demo incident details were reviewed.' },
      { status: 'Responder Assigned', time: '09:24', note: 'Demo responder assignment recorded.' },
      { status: 'Arrived', time: '09:31', note: 'Demo arrival update recorded.' },
      { status: 'Resolved', time: '09:48', note: 'Demo incident marked resolved.' }
    ],
    updates: ['All timeline entries are simulated and do not represent live dispatch activity.']
  },
  {
    id: 'ACC-2024-0306118',
    date: '03 Jul 2024, 21:05',
    shortDate: '03 Jul 2024',
    location: 'Madhya Marg, Chandigarh',
    type: 'Vehicle and pedestrian',
    description: 'Demo record retained for history display.',
    status: 'Cancelled',
    peopleInvolved: '2',
    injuries: 'Unknown',
    vehicles: 'Car',
    demo: true,
    timeline: [
      { status: 'Reported', time: '21:05', note: 'Report created in demo mode.' },
      { status: 'Cancelled', time: '21:14', note: 'Demo report marked cancelled by the citizen.' }
    ],
    updates: ['No real responders or emergency services were contacted.']
  }
]