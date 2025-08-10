export type Goal = {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
};

export type ActivityStatus = 'planned' | 'in-progress' | 'completed';

export type Activity = {
  id: string;
  name: string;
  type: string;
  status: ActivityStatus;
  startDate: string;
  endDate: string;
  goals: Goal[];
};

export type CampaignStatus = 'active' | 'planned' | 'completed' | 'paused';

export type Campaign = {
  id: string;
  name: string;
  description: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  goals: Goal[];
  activities: Activity[];
};

export type UpcomingActivity = Activity & { campaignName: string, campaignId: string };
