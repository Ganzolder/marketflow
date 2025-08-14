

import { Campaign, UpcomingAction, Action, Activity, KPI, Expense, EnrichedAction } from './types';
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, addDoc, writeBatch, runTransaction } from "firebase/firestore";
import { Combobox } from '@/components/ui/combobox';

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
          { id: 'goal-1', name: 'Увеличение продаж', target: 50000, current: 35000 },
          { id: 'goal-2', name: 'Привлечение новых клиентов', target: 1000, current: 650 },
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
              { id: 'g1', name: 'Охват', target: 100000, current: 75000 },
              { id: 'g2', name: 'Клики', target: 5000, current: 4200 }
            ],
            activities: [],
            generalExpenses: [],
            summaryKpis: [],
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
            generalExpenses: [],
            summaryKpis: [],
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
            { id: 'goal-3', name: 'Предзаказы', target: 2000, current: 150 },
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
             { id: 'goal-4', name: 'Упоминания в СМИ', target: 50, current: 62 },
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


export async function addAction(campaignId: string, action: Omit<Action, 'id' | 'goals' | 'activities' | 'generalExpenses' | 'summaryKpis'>) {
    const campaignRef = doc(db, "campaigns", campaignId);
    
    const newAction: Action = {
        ...action,
        id: `act-${campaignId.substring(0,4)}-${(Math.random() + 1).toString(36).substring(7)}`, // more unique ID
        goals: [],
        activities: [],
        generalExpenses: [],
        summaryKpis: [],
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
            
            const existingActivity = action.activities[activityIndex];
            const existingKpis = existingActivity.kpis || [];

            const updatedKpis = updatedActivity.kpis.map(uk => {
                const existingKpi = existingKpis.find(ek => ek.id === uk.id);
                return {
                    ...uk,
                    current: existingKpi ? existingKpi.current : 0,
                    includeInActionGoals: uk.includeInActionGoals,
                };
            });


            action.activities[activityIndex] = { 
              ...existingActivity, 
              ...updatedActivity, 
              kpis: updatedKpis 
            };
            
            transaction.update(campaignRef, { actions: newActions });
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw new Error(`Failed to update activity. ${e instanceof Error ? e.message : ''}`);
    }
}

export async function deleteActivity(campaignId: string, actionId: string, activityId: string) {
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
                 return; // Nothing to delete
            }

            action.activities = action.activities.filter(act => act.id !== activityId);
            
            transaction.update(campaignRef, { actions: newActions });
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw new Error(`Failed to delete activity. ${e instanceof Error ? e.message : ''}`);
    }
}

export async function updateActivityMetrics(campaignId: string, actionId: string, activityId: string, kpiUpdates: Record<string, number>) {
    const campaignRef = doc(db, 'campaigns', campaignId);

    try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) throw new Error("Campaign document does not exist!");

            const campaignData = campaignDoc.data() as Campaign;
            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            if (actionIndex === -1) throw new Error("Action not found in this campaign!");

            const newActions = [...campaignData.actions];
            const action = newActions[actionIndex];
            if (!action.activities) throw new Error("Activities array does not exist in this action!");

            const activityIndex = action.activities.findIndex(act => act.id === activityId);
            if (activityIndex === -1) throw new Error("Activity not found in this action!");

            const activity = action.activities[activityIndex];
            
            // Update KPIs
            if (activity.kpis && activity.kpis.length > 0) {
                activity.kpis = activity.kpis.map(kpi => {
                    if (kpiUpdates.hasOwnProperty(kpi.id)) {
                        return { ...kpi, current: kpiUpdates[kpi.id] };
                    }
                    return kpi;
                });
            }

            transaction.update(campaignRef, { actions: newActions });
        });
    } catch (e) {
        console.error("Metrics update transaction failed: ", e);
        throw e;
    }
}

export async function addExpenseToActivity(campaignId: string, actionId: string, activityId: string, expense: Omit<Expense, 'id'>) {
    const campaignRef = doc(db, 'campaigns', campaignId);

    try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) throw new Error("Campaign does not exist!");

            const campaignData = campaignDoc.data() as Campaign;
            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            if (actionIndex === -1) throw new Error("Action not found!");

            const newActions = [...campaignData.actions];
            const action = newActions[actionIndex];
            if (!action.activities) throw new Error("Activity array not found!");

            const activityIndex = action.activities.findIndex(act => act.id === activityId);
            if (activityIndex === -1) throw new Error("Activity not found!");

            const activity = action.activities[activityIndex];

            const newExpense: Expense = {
                ...expense,
                id: `exp-${activityId.substring(0,4)}-${(Math.random() + 1).toString(36).substring(7)}`,
            };

            if (!activity.expenses) {
                activity.expenses = [];
            }
            activity.expenses.push(newExpense);

            activity.spent = activity.expenses.reduce((acc, exp) => acc + exp.amount, 0);

            transaction.update(campaignRef, { actions: newActions });
        });
    } catch (e) {
        console.error("Add expense transaction failed: ", e);
        throw e;
    }
}

export async function updateExpense(campaignId: string, actionId: string, updatedExpense: Expense, originalActivityId: string, newActivityId: string) {
    if (originalActivityId === newActivityId) {
        // The expense stays in the same place (either general or the same activity)
        if (newActivityId === 'general') {
            await updateGeneralExpenseInAction(campaignId, actionId, updatedExpense);
        } else {
            await updateExpenseInActivity(campaignId, actionId, newActivityId, updatedExpense);
        }
    } else {
        // The expense is moving between lists
        const campaignRef = doc(db, 'campaigns', campaignId);
        try {
            await runTransaction(db, async (transaction) => {
                const campaignDoc = await transaction.get(campaignRef);
                if (!campaignDoc.exists()) throw new Error("Campaign does not exist!");

                const campaignData = campaignDoc.data() as Campaign;
                const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
                if (actionIndex === -1) throw new Error("Action not found!");

                const newActions = [...campaignData.actions];
                const action = newActions[actionIndex];
                
                // 1. Remove from original location
                if (originalActivityId === 'general') {
                     if (!action.generalExpenses) throw new Error("Original expense location (general) not found.");
                     action.generalExpenses = action.generalExpenses.filter(e => e.id !== updatedExpense.id);
                } else {
                    const activityIndex = action.activities.findIndex(a => a.id === originalActivityId);
                    if (activityIndex === -1) throw new Error("Original activity not found.");
                    const activity = action.activities[activityIndex];
                    if (!activity.expenses) throw new Error("Original expense location (activity) not found.");
                    activity.expenses = activity.expenses.filter(e => e.id !== updatedExpense.id);
                    // Recalculate spent for original activity
                    activity.spent = activity.expenses.reduce((acc, exp) => acc + exp.amount, 0);
                }

                // 2. Add to new location
                if (newActivityId === 'general') {
                    if (!action.generalExpenses) action.generalExpenses = [];
                    action.generalExpenses.push(updatedExpense);
                } else {
                     const activityIndex = action.activities.findIndex(a => a.id === newActivityId);
                    if (activityIndex === -1) throw new Error("New activity not found.");
                    const activity = action.activities[activityIndex];
                    if (!activity.expenses) activity.expenses = [];
                    activity.expenses.push(updatedExpense);
                     // Recalculate spent for new activity
                    activity.spent = activity.expenses.reduce((acc, exp) => acc + exp.amount, 0);
                }

                transaction.update(campaignRef, { actions: newActions });
            });
        } catch (e) {
            console.error("Move expense transaction failed: ", e);
            throw e;
        }
    }
}


async function updateExpenseInActivity(campaignId: string, actionId: string, activityId: string, updatedExpense: Expense) {
    const campaignRef = doc(db, 'campaigns', campaignId);
    try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) throw new Error("Campaign does not exist!");

            const campaignData = campaignDoc.data() as Campaign;
            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            if (actionIndex === -1) throw new Error("Action not found!");

            const newActions = [...campaignData.actions];
            const action = newActions[actionIndex];
            if (!action.activities) throw new Error("Activity array not found!");
            
            const activityIndex = action.activities.findIndex(act => act.id === activityId);
            if (activityIndex === -1) throw new Error("Activity not found!");
            
            const activity = action.activities[activityIndex];
            if (!activity.expenses) throw new Error("Expenses not found in activity!");

            const expenseIndex = activity.expenses.findIndex(e => e.id === updatedExpense.id);
            if (expenseIndex === -1) throw new Error("Expense not found!");

            activity.expenses[expenseIndex] = updatedExpense;
            activity.spent = activity.expenses.reduce((acc, exp) => acc + exp.amount, 0);

            transaction.update(campaignRef, { actions: newActions });
        });
    } catch (e) {
        console.error("Update expense transaction failed: ", e);
        throw e;
    }
}

export async function deleteExpenseFromActivity(campaignId: string, actionId: string, activityId: string, expenseId: string) {
    const campaignRef = doc(db, 'campaigns', campaignId);
    try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) throw new Error("Campaign does not exist!");

            const campaignData = campaignDoc.data() as Campaign;
            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            if (actionIndex === -1) throw new Error("Action not found!");

            const newActions = [...campaignData.actions];
            const action = newActions[actionIndex];
            if (!action.activities) return;

            const activityIndex = action.activities.findIndex(act => act.id === activityId);
            if (activityIndex === -1) return;

            const activity = action.activities[activityIndex];
            if (!activity.expenses) return;

            activity.expenses = activity.expenses.filter(e => e.id !== expenseId);
            activity.spent = activity.expenses.reduce((acc, exp) => acc + exp.amount, 0);

            transaction.update(campaignRef, { actions: newActions });
        });
    } catch (e) {
        console.error("Delete expense transaction failed: ", e);
        throw e;
    }
}


export async function getCampaigns(): Promise<Campaign[]> {
  const campaignsCollection = collection(db, "campaigns");
  const campaignsSnapshot = await getDocs(campaignsCollection);
  if (campaignsSnapshot.empty) {
    return await seedDatabase();
  }
  return campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign)).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function getCampaignById(id: string): Promise<Campaign | undefined> {
  const campaignRef = doc(db, "campaigns", id);
  const campaignSnap = await getDoc(campaignRef);
  
  const processCampaignData = (snap: any): Campaign => {
    const campaignData = snap.data() as Omit<Campaign, 'id'>;
      if (campaignData.actions) {
          campaignData.actions.forEach(action => {
              if (!action.generalExpenses) {
                  action.generalExpenses = [];
              }
               if (!action.summaryKpis) {
                  action.summaryKpis = [];
              }
              if (action.activities) {
                  action.activities.forEach(activity => {
                      if (!activity.expenses) {
                          activity.expenses = [];
                      }
                      activity.spent = activity.expenses.reduce((acc, expense) => acc + expense.amount, 0);

                      if (activity.kpis) {
                          activity.kpis.forEach(kpi => {
                              if (kpi.current === undefined) kpi.current = 0;
                              if (kpi.includeInActionGoals === undefined) kpi.includeInActionGoals = true;
                          });
                      }
                  });
              }
          });
      }
      return { id: snap.id, ...campaignData } as Campaign;
  }

  if (campaignSnap.exists()) {
    return processCampaignData(campaignSnap);
  } else {
    // This should ideally not happen in a real app, but for seeding purposes:
    await seedDatabase();
    const campaignSnapAfterSeed = await getDoc(campaignRef);
     if (campaignSnapAfterSeed.exists()) {
        return processCampaignData(campaignSnapAfterSeed);
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


export async function addGeneralExpenseToAction(campaignId: string, actionId: string, expense: Omit<Expense, 'id'>) {
    const campaignRef = doc(db, 'campaigns', campaignId);

    try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) throw new Error("Campaign does not exist!");

            const campaignData = campaignDoc.data() as Campaign;
            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            if (actionIndex === -1) throw new Error("Action not found!");

            const newActions = [...campaignData.actions];
            const action = newActions[actionIndex];

            const newExpense: Expense = {
                ...expense,
                id: `gexp-${actionId.substring(0,4)}-${(Math.random() + 1).toString(36).substring(7)}`,
            };

            if (!action.generalExpenses) {
                action.generalExpenses = [];
            }
            action.generalExpenses.push(newExpense);

            transaction.update(campaignRef, { actions: newActions });
        });
    } catch (e) {
        console.error("Add general expense transaction failed: ", e);
        throw e;
    }
}

async function updateGeneralExpenseInAction(campaignId: string, actionId: string, updatedExpense: Expense) {
    const campaignRef = doc(db, 'campaigns', campaignId);
    try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) throw new Error("Campaign does not exist!");

            const campaignData = campaignDoc.data() as Campaign;
            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            if (actionIndex === -1) throw new Error("Action not found!");

            const newActions = [...campaignData.actions];
            const action = newActions[actionIndex];
            
            if (!action.generalExpenses) throw new Error("General expenses not found!");
            
            const expenseIndex = action.generalExpenses.findIndex(e => e.id === updatedExpense.id);
            if (expenseIndex === -1) throw new Error("Expense not found!");

            action.generalExpenses[expenseIndex] = updatedExpense;

            transaction.update(campaignRef, { actions: newActions });
        });
    } catch (e) {
        console.error("Update general expense transaction failed: ", e);
        throw e;
    }
}

export async function deleteGeneralExpenseFromAction(campaignId: string, actionId: string, expenseId: string) {
    const campaignRef = doc(db, 'campaigns', campaignId);
    try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) throw new Error("Campaign does not exist!");
            
            const campaignData = campaignDoc.data() as Campaign;
            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            if (actionIndex === -1) throw new Error("Action not found!");

            const newActions = [...campaignData.actions];
            const action = newActions[actionIndex];
            if (!action.generalExpenses) return;

            action.generalExpenses = action.generalExpenses.filter(e => e.id !== expenseId);

            transaction.update(campaignRef, { actions: newActions });
        });
    } catch (e) {
        console.error("Delete general expense transaction failed: ", e);
        throw e;
    }
}

export async function getUniqueKpiNames(campaignId?: string): Promise<{value: string, label: string}[]> {
  const campaigns = await getCampaigns();
  const kpiNames = new Set<string>();
  
  // If a campaignId is provided, prioritize KPIs from that campaign
  if (campaignId) {
    const currentCampaign = campaigns.find(c => c.id === campaignId);
    currentCampaign?.actions?.forEach(action => {
      action.activities?.forEach(activity => {
        activity.kpis?.forEach(kpi => {
          kpiNames.add(kpi.name);
        });
      });
    });
  }

  // Then add KPIs from all other campaigns to ensure a complete list
  campaigns.forEach(campaign => {
    campaign.actions?.forEach(action => {
      action.activities?.forEach(activity => {
        activity.kpis?.forEach(kpi => {
          kpiNames.add(kpi.name);
        });
      });
    });
  });

  return Array.from(kpiNames).sort().map(name => ({ value: name, label: name }));
}

export async function updateActionSummaryKpis(campaignId: string, actionId: string, summaryKpis: string[]) {
    const campaignRef = doc(db, 'campaigns', campaignId);

    try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) throw new Error("Campaign document does not exist!");

            const campaignData = campaignDoc.data() as Campaign;
            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            if (actionIndex === -1) throw new Error("Action not found!");

            const newActions = [...campaignData.actions];
            newActions[actionIndex].summaryKpis = summaryKpis;

            transaction.update(campaignRef, { actions: newActions });
        });
    } catch (e) {
        console.error("Update summary KPIs transaction failed: ", e);
        throw e;
    }
}

export async function getAllActions(): Promise<EnrichedAction[]> {
  const campaigns = await getCampaigns();
  const allActions: EnrichedAction[] = [];

  campaigns.forEach(campaign => {
    if (campaign.actions) {
      campaign.actions.forEach(action => {
        allActions.push({
          ...action,
          campaignId: campaign.id,
          campaignName: campaign.name,
        });
      });
    }
  });

  return allActions.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}
