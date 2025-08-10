import type { Campaign, UpcomingActivity } from './types';

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'campaign-1',
    name: 'Summer Sale 2024',
    description: 'Annual summer sale campaign to boost Q3 revenue and clear inventory.',
    budget: 50000,
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    status: 'active',
    goals: [
      { id: 'g1-1', name: 'Website Traffic', target: 1000000, current: 650000, unit: 'visits' },
      { id: 'g1-2', name: 'Online Sales', target: 150000, current: 110000, unit: 'USD' },
      { id: 'g1-3', name: 'Social Media Mentions', target: 5000, current: 4200, unit: 'mentions' },
    ],
    activities: [
      {
        id: 'act1-1', name: 'Social Media Ads', type: 'Digital Ad', status: 'in-progress', startDate: '2024-06-01', endDate: '2024-08-31', goals: [
          { id: 'g1-1-1', name: 'Impressions', target: 5000000, current: 3200000, unit: 'views' }
        ]
      },
      {
        id: 'act1-2', name: 'Email Blast', type: 'Email Marketing', status: 'completed', startDate: '2024-06-15', endDate: '2024-07-30', goals: [
          { id: 'g1-2-1', name: 'Open Rate', target: 25, current: 28, unit: '%' }
        ]
      },
      {
        id: 'act1-3', name: 'Influencer Collab', type: 'Partnership', status: 'planned', startDate: '2024-07-20', endDate: '2024-08-20', goals: [
          { id: 'g1-3-1', name: 'Engagement', target: 10000, current: 0, unit: 'likes/comments' }
        ]
      },
    ],
  },
  {
    id: 'campaign-2',
    name: 'New Product Launch - "Quantum-Leap" Laptop',
    description: 'Global launch of our next-generation laptop with AI capabilities.',
    budget: 250000,
    startDate: '2024-09-01',
    endDate: '2024-11-30',
    status: 'planned',
    goals: [
      { id: 'g2-1', name: 'Pre-orders', target: 20000, current: 1500, unit: 'units' },
      { id: 'g2-2', name: 'Media Mentions', target: 100, current: 12, unit: 'articles' },
    ],
    activities: [
      { id: 'act2-1', name: 'Launch Event', type: 'Event', status: 'planned', startDate: '2024-09-01', endDate: '2024-09-01', goals: [] },
      { id: 'act2-2', name: 'Radio Ads', type: 'Traditional Ad', status: 'planned', startDate: '2024-09-15', endDate: '2024-10-15', goals: [] },
    ],
  },
  {
    id: 'campaign-3',
    name: 'Brand Awareness Q1',
    description: 'Increasing brand recognition in emerging markets.',
    budget: 75000,
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    status: 'completed',
    goals: [
      { id: 'g3-1', name: 'Brand Recall', target: 40, current: 45, unit: '%' },
    ],
    activities: [
      { id: 'act3-1', name: 'Billboard Ads', type: 'Traditional Ad', status: 'completed', startDate: '2024-01-15', endDate: '2024-03-15', goals: [] },
    ],
  },
  {
    id: 'campaign-4',
    name: 'Holiday Season Push',
    description: 'End-of-year sales push for the holiday season.',
    budget: 120000,
    startDate: '2024-11-01',
    endDate: '2024-12-31',
    status: 'planned',
    goals: [
        { id: 'g4-1', name: 'Sales Volume', target: 50000, current: 0, unit: 'units' }
    ],
    activities: [],
  },
];

export async function getCampaigns(): Promise<Campaign[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50));
  return MOCK_CAMPAIGNS;
}

export async function getCampaignById(id: string): Promise<Campaign | undefined> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50));
  return MOCK_CAMPAIGNS.find(campaign => campaign.id === id);
}

export async function getUpcomingActivities(): Promise<UpcomingActivity[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50));
  const today = new Date();
  const upcoming: UpcomingActivity[] = [];

  MOCK_CAMPAIGNS.forEach(campaign => {
    campaign.activities.forEach(activity => {
      if ((activity.status === 'planned' || activity.status === 'in-progress') && new Date(activity.startDate) >= today) {
        upcoming.push({
          ...activity,
          campaignName: campaign.name,
          campaignId: campaign.id
        });
      }
    });
  });

  return upcoming.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}
