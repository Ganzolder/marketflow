
import { Campaign, UpcomingAction, Action, Activity } from './types';
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, addDoc, writeBatch, runTransaction } from "firebase/firestore";

// Helper function to seed the database with initial data if it's empty
async function seedDatabase() {
  const campaignsCollection = collection(db, "campaigns");
  const campaignsSnapshot = await getDocs(campaignsCollection);
  if (campaignsSnapshot.empty) {
    console.log("Database is empty, seeding with initial data...");
    const initialCampaigns: Omit<Campaign, 'id'>[] = [
      {
        name: 'Летняя распродажа 2024',
        description: 'Большая распродажа для привлечения новых клиентов в летний сезон.',
        budget: 25000,
        startDate: '2024-06-01',
        endDate: '2024-08-31',
        status: 'active',
        goals: [
          { id: 'goal-1', name: 'Увеличение продаж', target: 50000, current: 35000, unit: 'USD' },
          { id: 'goal-2', name: 'Привлечение новых клиентов', target: 1000, current: 650, unit: 'клиентов' },
        ],
        actions: [
          {
            id: 'act-c1-1',
            name: 'Реклама в соцсетях',
            description: 'Продвижение через таргетированную рекламу в VK и Telegram.',
            targetAudience: 'Молодежь 18-25 лет',
            status: 'in-progress',
            startDate: '2024-06-01',
            endDate: '2024-07-31',
            goals: [
              { id: 'g1', name: 'Охват', target: 100000, current: 75000, unit: 'показов' },
              { id: 'g2', name: 'Клики', target: 5000, current: 4200, unit: 'кликов' }
            ],
            activities: [],
          },
          {
            id: 'act-c1-2',
            name: 'Email-рассылка',
            description: 'Информационная рассылка по базе лояльных клиентов.',
            targetAudience: 'Существующие клиенты',
            status: 'planned',
            startDate: '2024-07-15',
            endDate: '2024-08-15',
            goals: [],
            activities: [],
          }
        ],
      },
      {
        name: 'Запуск нового продукта "Квант"',
        description: 'Маркетинговая кампания для запуска нового инновационного продукта.',
        budget: 75000,
        startDate: '2024-09-01',
        endDate: '2024-11-30',
        status: 'planned',
        goals: [
            { id: 'goal-3', name: 'Предзаказы', target: 2000, current: 150, unit: 'единиц' },
        ],
        actions: [],
      },
      {
        name: 'Кампания по повышению узнаваемости бренда Q1 2024',
        description: 'Кампания, направленная на повышение узнаваемости бренда среди целевой аудитории.',
        budget: 15000,
        startDate: '2024-01-15',
        endDate: '2024-03-31',
        status: 'completed',
        goals: [
             { id: 'goal-4', name: 'Упоминания в СМИ', target: 50, current: 62, unit: 'упоминаний' },
        ],
        actions: [],
      }
    ];

    const batch = writeBatch(db);
    initialCampaigns.forEach(campaignData => {
      const docRef = doc(collection(db, "campaigns"));
      batch.set(docRef, campaignData);
    });
    await batch.commit();

    console.log("Database seeded with initial data.");
    // Re-fetch the data after seeding
    const newSnapshot = await getDocs(campaignsCollection);
    return newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));
  }
   return campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));
}


export async function addAction(campaignId: string, action: Omit<Action, 'id' | 'goals' | 'activities'>) {
    const campaignRef = doc(db, "campaigns", campaignId);
    
    const newAction: Action = {
        ...action,
        id: `act-${campaignId.substring(0,4)}-${(Math.random() + 1).toString(36).substring(7)}`, // more unique ID
        goals: [], // Start with no goals
        activities: [], // Start with no activities
    };
    await updateDoc(campaignRef, {
        actions: arrayUnion(newAction)
    });
}

export async function updateAction(campaignId: string, updatedAction: Action) {
  const campaignRef = doc(db, 'campaigns', campaignId);
  
  try {
    await runTransaction(db, async (transaction) => {
      const campaignDoc = await transaction.get(campaignRef);
      if (!campaignDoc.exists()) {
        throw "Campaign document does not exist!";
      }

      const campaignData = campaignDoc.data() as Campaign;
      const actionIndex = campaignData.actions.findIndex(a => a.id === updatedAction.id);
      
      if (actionIndex === -1) {
        throw "Action not found in this campaign!";
      }

      const newActions = [...campaignData.actions];
      newActions[actionIndex] = { ...newActions[actionIndex], ...updatedAction };

      transaction.update(campaignRef, { actions: newActions });
    });
  } catch (e) {
    console.error("Transaction failed: ", e);
    throw new Error('Failed to update action.');
  }
}

export async function addActivity(campaignId: string, actionId: string, activity: Omit<Activity, 'id'>) {
    const campaignRef = doc(db, 'campaigns', campaignId);

    try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) {
                throw "Campaign document does not exist!";
            }

            const campaignData = campaignDoc.data() as Campaign;
            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            
            if (actionIndex === -1) {
                throw "Action not found in this campaign!";
            }

            const newActivity: Activity = {
                ...activity,
                id: `activity-${actionId.substring(0,4)}-${(Math.random() + 1).toString(36).substring(7)}`,
            };

            const newActions = [...campaignData.actions];
            
            // Ensure activities array exists
            if (!newActions[actionIndex].activities) {
                newActions[actionIndex].activities = [];
            }
            
            newActions[actionIndex].activities.push(newActivity);
            
            transaction.update(campaignRef, { actions: newActions });
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw new Error('Failed to add activity.');
    }
}

export async function updateActivity(campaignId: string, actionId: string, updatedActivity: Activity) {
    const campaignRef = doc(db, 'campaigns', campaignId);

    try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) {
                throw new Error("Campaign document does not exist!");
            }

            const campaignData = campaignDoc.data() as Campaign;
            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            
            if (actionIndex === -1) {
                throw new Error("Action not found in this campaign!");
            }
            
            const newActions = [...campaignData.actions];
            const action = newActions[actionIndex];
            
            if (!action.activities) {
                 throw new Error("Activities array does not exist in this action!");
            }

            const activityIndex = action.activities.findIndex(act => act.id === updatedActivity.id);
            
            if (activityIndex === -1) {
                throw new Error("Activity not found in this action!");
            }

            action.activities[activityIndex] = { ...action.activities[activityIndex], ...updatedActivity };
            
            transaction.update(campaignRef, { actions: newActions });
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw new Error(`Failed to update activity. ${e instanceof Error ? e.message : ''}`);
    }
}


export async function getCampaigns(): Promise<Campaign[]> {
  const campaignsCollection = collection(db, "campaigns");
  const campaignsSnapshot = await getDocs(campaignsCollection);
  if (campaignsSnapshot.empty) {
    // This will seed the database and return the seeded data
    return await seedDatabase();
  }
  return campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign)).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function getCampaignById(id: string): Promise<Campaign | undefined> {
  const campaignRef = doc(db, "campaigns", id);
  const campaignSnap = await getDoc(campaignRef);

  if (campaignSnap.exists()) {
    return { id: campaignSnap.id, ...campaignSnap.data() } as Campaign;
  } else {
    // If not found, maybe the DB is not seeded yet.
    // This is a fallback for development.
    await seedDatabase();
    const campaignSnapAfterSeed = await getDoc(campaignRef);
     if (campaignSnapAfterSeed.exists()) {
        return { id: campaignSnapAfterSeed.id, ...campaignSnapAfterSeed.data() } as Campaign;
    }
    return undefined;
  }
}

export async function getUpcomingActions(): Promise<UpcomingAction[]> {
  const campaigns = await getCampaigns();
  const today = new Date();
  const upcoming: UpcomingAction[] = [];

  campaigns.forEach(campaign => {
    if (campaign.actions) {
        campaign.actions.forEach(action => {
            if ((action.status === 'planned' || action.status === 'in-progress') && new Date(action.startDate) >= today) {
                upcoming.push({
                ...action,
                campaignName: campaign.name,
                campaignId: campaign.id
                });
            }
        });
    }
  });

  return upcoming.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}
