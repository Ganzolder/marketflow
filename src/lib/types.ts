

export type Goal = {
  id: string;
  name: string;
  target: number;
  current: number;
};

export type ActionStatus = 'planned' | 'in-progress' | 'completed';

export type KpiMetricLog = {
    id: string;
    date: string; // ISO string for the date of the entry
    value: number; // The value for that specific entry
}

export type KPI = {
  id: string;
  name: string;
  target: number;
  current: number; // This will be calculated on the fly, but kept for simplicity in display components
  metrics: KpiMetricLog[]; // History of metric entries
  parentId: string | null; // ID of the parent KPI for conversion tracking
  includeInActionGoals?: boolean;
}

export type Expense = {
    id: string;
    description: string;
    amount: number;
    date: string;
    legalEntity?: string;
    photoURL?: string;
}

export type Activity = {
  id: string;
  name: string;
  description?: string;
  trackingMethod?: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  kpis: KPI[];
  expenses: Expense[];
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
  generalExpenses: Expense[];
  summaryKpis?: string[]; // Names of aggregated KPIs to show on the campaign page action card
  plannedAverageCheck?: number;
  actualAverageCheck?: number;
  plannedMarginality?: number;
  actualMarginality?: number;
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

export type EnrichedAction = Action & { campaignName: string, campaignId: string };

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
    trackingMethod?: string[];
  };
};

export type CampaignFormState = {
  message: string;
  error?: boolean;
  errors?: {
    name?: string[];
    description?: string[];
    budget?: string[];
    startDate?: string[];
    endDate?: string[];
  };
};
