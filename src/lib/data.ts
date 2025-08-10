import { Campaign, UpcomingAction, Action } from './types';
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

// Helper function to fetch initial data if the database is empty
async function seedDatabase() {
  const campaignsCollection = collection(db, "campaigns");
  const campaignsSnapshot = await getDocs(campaignsCollection);
  if (campaignsSnapshot.empty) {
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
            type: 'Цифровая реклама',
            status: 'in-progress',
            startDate: '2024-06-01',
            endDate: '2024-07-31',
            goals: [
              { id: 'g1', name: 'Охват', target: 100000, current: 75000, unit: 'показов' },
              { id: 'g2', name: 'Клики', target: 5000, current: 4200, unit: 'кликов' }
            ]
          },
          {
            id: 'act-c1-2',
            name: 'Email-рассылка',
            type: 'Email-маркетинг',
            status: 'planned',
            startDate: '2024-07-15',
            endDate: '2024-08-15',
            goals: []
          }
        ],
      },
      // ... more initial campaigns if needed
    ];
    for (const campaignData of initialCampaigns) {
      await addDoc(collection(db, "campaigns"), campaignData);
    }
    console.log("Database seeded with initial data.");
  }
}


// Simulate a database write operation
export async function addAction(campaignId: string, action: Omit<Action, 'id' | 'goals'>) {
    const campaignRef = doc(db, "campaigns", campaignId);
    const campaignDoc = await getDoc(campaignRef);

    if (campaignDoc.exists()) {
        const campaignData = campaignDoc.data() as Campaign;
        const newAction: Action = {
            ...action,
            id: `act-${campaignId}-${campaignData.actions.length + 1}`,
            goals: [] // Start with no goals
        };
        await updateDoc(campaignRef, {
            actions: arrayUnion(newAction)
        });
    } else {
        throw new Error('Campaign not found');
    }
}


export async function getCampaigns(): Promise<Campaign[]> {
  const campaignsCollection = collection(db, "campaigns");
  const campaignsSnapshot = await getDocs(campaignsCollection);
  if (campaignsSnapshot.empty) {
    // This is a temporary measure for development to ensure there's data.
    // In a real application, you might handle this differently.
    const mockCampaigns: Campaign[] = [
      {
        id: 'c1',
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
            type: 'Цифровая реклама',
            status: 'in-progress',
            startDate: '2024-06-01',
            endDate: '2024-07-31',
            goals: [
              { id: 'g1', name: 'Охват', target: 100000, current: 75000, unit: 'показов' },
              { id: 'g2', name: 'Клики', target: 5000, current: 4200, unit: 'кликов' }
            ]
          },
          {
            id: 'act-c1-2',
            name: 'Email-рассылка',
            type: 'Email-маркетинг',
            status: 'planned',
            startDate: '2024-07-15',
            endDate: '2024-08-15',
            goals: []
          }
        ],
      },
      {
        id: 'c2',
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
        id: 'c3',
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
    return mockCampaigns;
  }
  return campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));
}

export async function getCampaignById(id: string): Promise<Campaign | undefined> {
  const campaignRef = doc(db, "campaigns", id);
  const campaignSnap = await getDoc(campaignRef);

  if (campaignSnap.exists()) {
    return { id: campaignSnap.id, ...campaignSnap.data() } as Campaign;
  } else {
    return undefined;
  }
}

export async function getUpcomingActions(): Promise<UpcomingAction[]> {
  const campaigns = await getCampaigns();
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
