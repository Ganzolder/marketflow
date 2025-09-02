

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
  includeInActionGoals: boolean;
  multiplicity: number; // For cost calculation, e.g. 1000 for CPM
}

export type ExpenseStatus = 'planned' | 'invoice-received' | 'pending-payment' | 'paid';

export type Expense = {
    id: string;
    description: string;
    amount: number;
    date: string;
    status: ExpenseStatus;
    legalEntity?: string;
    photoURL?: string;
}

export type ResourceStatus = 'draft' | 'planned' | 'in-progress' | 'ready';

export type Resource = {
  id: string;
  name: string;
  status: ResourceStatus;
  responsiblePerson?: string;
  plannedDate?: string;
  linkedExpenseId?: string;
};

export type SocialPostStatus = 'draft' | 'ready' | 'published';
export const SocialPlatforms = ["Telegram", "VK", "Instagram", "Facebook", "TikTok", "YouTube", "Одноклассники"] as const;
export type SocialPlatform = typeof SocialPlatforms[number];

export type SocialPost = {
  id: string;
  title: string;
  platforms: SocialPlatform[];
  text: string;
  plannedReach: number;
  actualReach?: number;
  plannedComments: number;
  actualComments?: number;
  publicationDate: string;
  status: SocialPostStatus;
  campaignId?: string; // To link back to a campaign
  actionId?: string; // To link back to an action
  activityId?: string; // To link back to an activity (optional)
};

export type AiSocialPost = Pick<SocialPost, 'id' | 'title' | 'text' | 'publicationDate' | 'status'>;

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
  conditions?: string;
  mechanics?: string;
  targetAudience?: string;
  status: ActionStatus;
  startDate: string;
  endDate: string;
  goals: Goal[];
  activities: Activity[];
  generalExpenses: Expense[];
  summaryKpis?: string[]; // Names of aggregated KPIs to show on the campaign page action card
  salesKpiName?: string; // Name of the KPI to be used for sales calculation
  plannedAverageCheck?: number;
  actualAverageCheck?: number;
  plannedMarginality?: number;
  actualMarginality?: number;
  plannedRevenue?: number;
  plannedProfit?: number;
  responsiblePerson?: string;
  marketingHead?: string;
  financeHead?: string;
  itHead?: string;
  curator?: string;
  salesHead?: string;
  resources?: Resource[];
};

export type CampaignStatus = 'active' | 'planned' | 'completed' | 'paused' | 'archived';

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
  company?: string;
  address?: string;
  phone?: string;
};

export type TaskStatus = 'planned' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  deadline: string;
  responsiblePerson: string;
  isArchived: boolean;
  campaignId?: string;
  actionId?: string;
  activityId?: string;
};

export type UpcomingAction = Action & { campaignName: string, campaignId: string };

export type EnrichedAction = Action & { campaignName: string, campaignId: string };

export type EnrichedActivity = Activity & {
  actionName: string;
  actionId: string;
  campaignName: string;
  campaignId: string;
};

export type EnrichedSocialPost = SocialPost & {
  actionName: string;
  actionId: string;
  campaignName: string;
  campaignId: string;
}

export type EnrichedTask = Task & {
  campaignName?: string;
  actionName?: string;
  activityName?: string;
}

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
  fields?: Record<string, any>;
};

export type ResponsibilityFormState = {
    message: string;
    error?: boolean;
    errors?: {
        responsiblePerson?: string[];
        marketingHead?: string[];
        financeHead?: string[];
        itHead?: string[];
        curator?: string[];
        salesHead?: string[];
    }
}

export type MechanicsFormState = {
  message: string;
  error?: boolean;
  errors?: {
    mechanics?: string[];
  }
}

export type ResourceStatusFormState = {
  message: string;
  error?: boolean;
};

export type ExpenseStatusFormState = {
  message: string;
  error?: boolean;
};

export type SocialPostFormState = {
  message: string;
  error?: boolean;
  errors?: {
    title?: string[];
    platforms?: string[];
    text?: string[];
    plannedReach?: string[];
    plannedComments?: string[];
    publicationDate?: string[];
    status?: string[];
    activityId?: string[];
    campaignId?: string[];
    actionId?: string[];
  }
};

export type SocialPostMetricsFormState = {
  message: string;
  error?: boolean;
  errors?: {
    actualReach?: string[];
    actualComments?: string[];
  }
}

export type TaskFormState = {
  message: string;
  error?: boolean;
  errors?: {
    title?: string[];
    description?: string[];
    status?: string[];
    priority?: string[];
    deadline?: string[];
    responsiblePerson?: string[];
  };
};

export type TaskLinkState = {
  message: string;
  error?: boolean;
  errors?: {
    taskId?: string[];
    campaignId?: string[];
    actionId?: string[];
    activityId?: string[];
  };
}

export type UpcomingEvent = {
    type: 'task' | 'post';
    date: string;
    title: string;
    id: string;
    status: TaskStatus | SocialPostStatus;
    details: string;
    link: string;
}
