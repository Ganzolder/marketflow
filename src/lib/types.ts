
export type Goal = {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
};

export type ActionStatus = 'planned' | 'in-progress' | 'completed';

export type KPI = {
  id: string;
  name: string;
  target: number;
  current: number; 
  unit: string;
  multiple: number;
  parentId: string | null; // ID of the parent KPI for conversion tracking
}

export type Activity = {
  id: string;
  name: string;
  description?: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  kpis: KPI[];
};

export type Action = {
  id: string;
  name: string;
  description?: string;
  targetAudience?: string;
  status: ActionStatus;
  startDate: string;
  endDate: string;
  goals: Goal[];
  activities: Activity[];
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

export type ActivityFormState = {
  message: string;
  error?: boolean;
  errors?: {
    name?: string[];
    description?: string[];
    budget?: string[];
    startDate?: string[];
    endDate?: string[];
    kpis?: string[];
  };
};
