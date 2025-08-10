import type { Campaign, UpcomingAction, Action } from './types';
import { db } from './db';

// Simulate a database write operation
export async function addAction(campaignId: string, action: Omit<Action, 'id' | 'goals'>) {
    const data = await db.read();
    const campaign = data.campaigns.find(c => c.id === campaignId);
    if (campaign) {
        const newAction: Action = {
            ...action,
            id: `act-${campaignId}-${campaign.actions.length + 1}`,
            goals: [] // Start with no goals
        };
        campaign.actions.push(newAction);
        await db.write(data);
    } else {
        throw new Error('Campaign not found');
    }
}


export async function getCampaigns(): Promise<Campaign[]> {
  const { campaigns } = await db.read();
  return campaigns;
}

export async function getCampaignById(id: string): Promise<Campaign | undefined> {
  const { campaigns } = await db.read();
  return campaigns.find(campaign => campaign.id === id);
}

export async function getUpcomingActions(): Promise<UpcomingAction[]> {
  const { campaigns } = await db.read();
  const today = new Date();
  const upcoming: UpcomingAction[] = [];

  campaigns.forEach(campaign => {
    campaign.actions.forEach(action => {
      if ((action.status === 'planned' || action.status === 'in-progress') && new Date(action.startDate) >= today) {
        upcoming.push({
          ...action,
          campaignName: campaign.name,
          campaignId: campaign.id
        });
      }
    });
  });

  return upcoming.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}
