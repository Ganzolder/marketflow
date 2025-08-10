import type { Campaign, UpcomingAction, Action } from './types';

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'campaign-1',
    name: 'Летняя распродажа 2024',
    description: 'Ежегодная летняя распродажа для увеличения выручки в 3 квартале и освобождения склада.',
    budget: 50000,
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    status: 'active',
    goals: [
      { id: 'g1-1', name: 'Трафик на сайт', target: 1000000, current: 650000, unit: 'посещений' },
      { id: 'g1-2', name: 'Онлайн-продажи', target: 150000, current: 110000, unit: 'USD' },
      { id: 'g1-3', name: 'Упоминания в соцсетях', target: 5000, current: 4200, unit: 'упоминаний' },
    ],
    actions: [
      {
        id: 'act1-1', name: 'Реклама в соцсетях', type: 'Цифровая реклама', status: 'in-progress', startDate: '2024-06-01', endDate: '2024-08-31', goals: [
          { id: 'g1-1-1', name: 'Показы', target: 5000000, current: 3200000, unit: 'просмотров' }
        ]
      },
      {
        id: 'act1-2', name: 'Email-рассылка', type: 'Email-маркетинг', status: 'completed', startDate: '2024-06-15', endDate: '2024-07-30', goals: [
          { id: 'g1-2-1', name: 'Процент открытий', target: 25, current: 28, unit: '%' }
        ]
      },
      {
        id: 'act1-3', name: 'Сотрудничество с инфлюенсерами', type: 'Партнерство', status: 'planned', startDate: '2024-07-20', endDate: '2024-08-20', goals: [
          { id: 'g1-3-1', name: 'Вовлеченность', target: 10000, current: 0, unit: 'лайков/комментариев' }
        ]
      },
    ],
  },
  {
    id: 'campaign-2',
    name: 'Запуск нового продукта - ноутбук "Квантовый скачок"',
    description: 'Глобальный запуск нашего ноутбука следующего поколения с возможностями ИИ.',
    budget: 250000,
    startDate: '2024-09-01',
    endDate: '2024-11-30',
    status: 'planned',
    goals: [
      { id: 'g2-1', name: 'Предзаказы', target: 20000, current: 1500, unit: 'штук' },
      { id: 'g2-2', name: 'Упоминания в СМИ', target: 100, current: 12, unit: 'статей' },
    ],
    actions: [
      { id: 'act2-1', name: 'Акция по запуску', type: 'Событие', status: 'planned', startDate: '2024-09-01', endDate: '2024-09-01', goals: [] },
      { id: 'act2-2', name: 'Реклама на радио', type: 'Традиционная реклама', status: 'planned', startDate: '2024-09-15', endDate: '2024-10-15', goals: [] },
    ],
  },
  {
    id: 'campaign-3',
    name: 'Повышение узнаваемости бренда Q1',
    description: 'Повышение узнаваемости бренда на развивающихся рынках.',
    budget: 75000,
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    status: 'completed',
    goals: [
      { id: 'g3-1', name: 'Узнаваемость бренда', target: 40, current: 45, unit: '%' },
    ],
    actions: [
      { id: 'act3-1', name: 'Реклама на билбордах', type: 'Традиционная реклама', status: 'completed', startDate: '2024-01-15', endDate: '2024-03-15', goals: [] },
    ],
  },
  {
    id: 'campaign-4',
    name: 'Продвижение в праздничный сезон',
    description: 'Стимулирование продаж в конце года в праздничный сезон.',
    budget: 120000,
    startDate: '2024-11-01',
    endDate: '2024-12-31',
    status: 'planned',
    goals: [
        { id: 'g4-1', name: 'Объем продаж', target: 50000, current: 0, unit: 'штук' }
    ],
    actions: [],
  },
];

// Simulate a database write operation
export async function addAction(campaignId: string, action: Omit<Action, 'id' | 'goals'>) {
    await new Promise(resolve => setTimeout(resolve, 50));
    const campaign = MOCK_CAMPAIGNS.find(c => c.id === campaignId);
    if (campaign) {
        const newAction: Action = {
            ...action,
            id: `act-${campaignId}-${campaign.actions.length + 1}`,
            goals: [] // Start with no goals
        };
        campaign.actions.push(newAction);
    } else {
        throw new Error('Campaign not found');
    }
}


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

export async function getUpcomingActions(): Promise<UpcomingAction[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50));
  const today = new Date();
  const upcoming: UpcomingAction[] = [];

  MOCK_CAMPAIGNS.forEach(campaign => {
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
