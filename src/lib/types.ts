export type Goal = {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
};

export type ActionStatus = 'planned' | 'in-progress' | 'completed';

export type Action = {
  id: string;
  name: string;
  type: string;
  status: ActionStatus;
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
  actions: Action[];
};

export type UpcomingAction = Action & { campaignName: string, campaignId: string };
