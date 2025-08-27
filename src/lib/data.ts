
"use server";

import { Campaign, UpcomingAction, Action, Activity, KPI, Expense, EnrichedAction, ActionStatus, CampaignStatus, KpiMetricLog, EnrichedActivity, Resource, ResourceStatus, ExpenseStatus, SocialPost, EnrichedSocialPost, Task, TaskStatus, EnrichedTask, UpcomingEvent } from './types';
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, addDoc, writeBatch, runTransaction, deleteDoc, arrayRemove } from "firebase/firestore";

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
            plannedAverageCheck: 0,
            actualAverageCheck: 0,
            plannedMarginality: 0,
            actualMarginality: 0,
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
            plannedAverageCheck: 0,
            actualAverageCheck: 0,
            plannedMarginality: 0,
            actualMarginality: 0,
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
      const docRef = doc(collection(db, "campaigns")); // Correctly generate a new document reference
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
        plannedAverageCheck: 0,
        actualAverageCheck: 0,
        plannedMarginality: 0,
        actualMarginality: 0,
        conditions: action.conditions || '',
        resources: [],
    };
    await updateDoc(campaignRef, {
        actions: arrayUnion(newAction)
    });
}

export async function updateAction(campaignId: string, updatedAction: Partial<Action> & { id: string }) {
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

export async function moveActionToCampaign(actionId: string, oldCampaignId: string, newCampaignId: string, updatedActionData: Partial<Omit<Action, 'id'>>) {
    const oldCampaignRef = doc(db, 'campaigns', oldCampaignId);
    const newCampaignRef = doc(db, 'campaigns', newCampaignId);

    try {
        await runTransaction(db, async (transaction) => {
            const oldCampaignDoc = await transaction.get(oldCampaignRef);
            const newCampaignDoc = await transaction.get(newCampaignRef);

            if (!oldCampaignDoc.exists()) throw new Error(`Source campaign ${oldCampaignId} not found`);
            if (!newCampaignDoc.exists()) throw new Error(`Destination campaign ${newCampaignId} not found`);

            const oldCampaignData = oldCampaignDoc.data() as Campaign;
            
            const actionToMoveIndex = oldCampaignData.actions.findIndex(a => a.id === actionId);
            if (actionToMoveIndex === -1) throw new Error(`Action ${actionId} not found in source campaign`);

            const [actionToMove] = oldCampaignData.actions.splice(actionToMoveIndex, 1);
            
            const updatedAction = { ...actionToMove, ...updatedActionData };

            transaction.update(oldCampaignRef, { actions: oldCampaignData.actions });
            transaction.update(newCampaignRef, { actions: arrayUnion(updatedAction) });
        });
    } catch(e) {
        console.error("Move action transaction failed:", e);
        throw e;
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
            if (!campaignDoc.exists()) throw new Error("Campaign document does not exist!");

            const campaignData = campaignDoc.data() as Campaign;
            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            if (actionIndex === -1) throw new Error("Action not found in this campaign!");
            
            const newActions = [...campaignData.actions];
            const action = newActions[actionIndex];
            
            if (!action.activities) throw new Error("Activities array does not exist in this action!");

            const activityIndex = action.activities.findIndex(act => act.id === updatedActivity.id);
            if (activityIndex === -1) throw new Error("Activity not found in this action!");
            
            const existingActivity = action.activities[activityIndex];
            
            const updatedKpis = (updatedActivity.kpis || []).map(uk => {
                const existingKpi = (existingActivity.kpis || []).find(ek => ek.id === uk.id);
                return {
                    ...uk,
                    // Preserve existing metrics and current value
                    metrics: existingKpi?.metrics || [],
                    current: existingKpi?.current || 0,
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
            
            if (activity.kpis && activity.kpis.length > 0) {
                const today = new Date().toISOString().split('T')[0];
                activity.kpis = activity.kpis.map(kpi => {
                    const newValue = kpiUpdates[kpi.id];
                    if (newValue) { // only update if a new value was provided
                        if (!kpi.metrics) {
                            kpi.metrics = [];
                        }
                        const newLogEntry: KpiMetricLog = {
                            id: `log-${kpi.id}-${Date.now()}`,
                            date: today,
                            value: newValue,
                        };
                        kpi.metrics.push(newLogEntry);
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
                     const originalExpense = action.generalExpenses.find(e => e.id === updatedExpense.id);
                     updatedExpense.status = originalExpense?.status || 'planned';
                     action.generalExpenses = action.generalExpenses.filter(e => e.id !== updatedExpense.id);
                } else {
                    const activityIndex = action.activities.findIndex(a => a.id === originalActivityId);
                    if (activityIndex === -1) throw new Error("Original activity not found.");
                    const activity = action.activities[activityIndex];
                    if (!activity.expenses) throw new Error("Original expense location (activity) not found.");
                    const originalExpense = activity.expenses.find(e => e.id === updatedExpense.id);
                    updatedExpense.status = originalExpense?.status || 'planned';
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
            
            updatedExpense.status = activity.expenses[expenseIndex].status || 'planned';
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
    // Only seed if you truly want to. For this app, maybe it's better to start empty.
    // If you want to seed, you can call it here, but it will re-seed if the user deletes everything.
    // return await seedDatabase();
    return [];
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
              if (!action.generalExpenses) action.generalExpenses = [];
              action.generalExpenses.forEach(exp => {
                if (!exp.status) exp.status = 'planned';
              });

              if (!action.summaryKpis) action.summaryKpis = [];
              if (!action.resources) action.resources = [];
              if (!action.plannedAverageCheck) action.plannedAverageCheck = 0;
              if (!action.actualAverageCheck) action.actualAverageCheck = 0;
              if (!action.plannedMarginality) action.plannedMarginality = 0;
              if (!action.actualMarginality) action.actualMarginality = 0;
              if (!action.conditions) action.conditions = '';
              if (action.activities) {
                  action.activities.forEach(activity => {
                      if (!activity.expenses) activity.expenses = [];
                       activity.expenses.forEach(exp => {
                         if (!exp.status) exp.status = 'planned';
                       });
                      activity.spent = activity.expenses.reduce((acc, expense) => acc + expense.amount, 0);

                      if (!activity.kpis) activity.kpis = [];
                      activity.kpis.forEach(kpi => {
                          if (!kpi.metrics) kpi.metrics = [];
                          kpi.current = kpi.metrics.reduce((acc, metric) => acc + metric.value, 0);
                          if (kpi.includeInActionGoals === undefined) kpi.includeInActionGoals = true;
                          if (kpi.parentId === undefined) kpi.parentId = null;
                          if (kpi.multiplicity === undefined) kpi.multiplicity = 1;
                      });
                  });
              }
          });
      }
      return { id: snap.id, ...campaignData } as Campaign;
  }

  if (campaignSnap.exists()) {
    return processCampaignData(campaignSnap);
  } else {
    // This should ideally not happen in a real app. Returning undefined is better than re-seeding.
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


export async function getAllActions(): Promise<EnrichedAction[]> {
  const campaigns = await getCampaigns();
  const allActions: EnrichedAction[] = [];

  campaigns.forEach(campaign => {
    (campaign.actions || []).forEach(action => {
      // Enrich each action with campaign info
      const enrichedAction = {
        ...action,
        campaignName: campaign.name,
        campaignId: campaign.id,
      };

      // Process activities within the action to ensure data consistency
      if (enrichedAction.activities) {
        enrichedAction.activities.forEach(activity => {
          if (!activity.expenses) activity.expenses = [];
          activity.expenses.forEach(exp => { if (!exp.status) exp.status = 'planned'; });
          activity.spent = activity.expenses.reduce((acc, expense) => acc + expense.amount, 0);

          if (!activity.kpis) activity.kpis = [];
          activity.kpis.forEach(kpi => {
            if (!kpi.metrics) kpi.metrics = [];
            kpi.current = kpi.metrics.reduce((acc, metric) => acc + metric.value, 0);
            if (kpi.includeInActionGoals === undefined) kpi.includeInActionGoals = true;
            if (kpi.parentId === undefined) kpi.parentId = null;
            if (kpi.multiplicity === undefined) kpi.multiplicity = 1;
          });
        });
      } else {
        enrichedAction.activities = [];
      }
      
      if (!enrichedAction.generalExpenses) enrichedAction.generalExpenses = [];
      enrichedAction.generalExpenses.forEach(exp => { if (!exp.status) exp.status = 'planned'; });
      if (!enrichedAction.summaryKpis) enrichedAction.summaryKpis = [];
      if (!enrichedAction.plannedAverageCheck) enrichedAction.plannedAverageCheck = 0;
      if (!enrichedAction.actualAverageCheck) enrichedAction.actualAverageCheck = 0;
      if (!enrichedAction.plannedMarginality) enrichedAction.plannedMarginality = 0;
      if (!enrichedAction.actualMarginality) enrichedAction.actualMarginality = 0;
      
      allActions.push(enrichedAction);
    });
  });

  return allActions.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function getAllActivities(): Promise<EnrichedActivity[]> {
  const campaigns = await getCampaigns();
  const allActivities: EnrichedActivity[] = [];

  campaigns.forEach(campaign => {
    (campaign.actions || []).forEach(action => {
      (action.activities || []).forEach(activity => {
        
        // Enrich activity with parent info
        const enrichedActivity: EnrichedActivity = {
          ...activity,
          actionName: action.name,
          actionId: action.id,
          campaignName: campaign.name,
          campaignId: campaign.id,
        };

        // Ensure data consistency for the activity
        if (!enrichedActivity.expenses) enrichedActivity.expenses = [];
        enrichedActivity.expenses.forEach(exp => { if (!exp.status) exp.status = 'planned'; });
        enrichedActivity.spent = enrichedActivity.expenses.reduce((acc, expense) => acc + expense.amount, 0);
        if (!enrichedActivity.kpis) enrichedActivity.kpis = [];
        enrichedActivity.kpis.forEach(kpi => {
          if (!kpi.metrics) kpi.metrics = [];
          kpi.current = kpi.metrics.reduce((acc, metric) => acc + metric.value, 0);
          if (kpi.includeInActionGoals === undefined) kpi.includeInActionGoals = true;
          if (kpi.parentId === undefined) kpi.parentId = null;
          if (kpi.multiplicity === undefined) kpi.multiplicity = 1;
        });

        allActivities.push(enrichedActivity);
      });
    });
  });

  return allActivities.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function getSocialPosts(): Promise<SocialPost[]> {
    const postsCollection = collection(db, "socialPosts");
    const postsSnapshot = await getDocs(postsCollection);
    return postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SocialPost));
}

export async function getAllSocialPosts(): Promise<EnrichedSocialPost[]> {
    const posts = await getSocialPosts();
    const campaigns = await getCampaigns();
    
    return posts.map(post => {
        let campaignName: string | undefined;
        let actionName: string | undefined;
        let activityName: string | undefined;

        if (post.campaignId) {
            const campaign = campaigns.find(c => c.id === post.campaignId);
            if (campaign) {
                campaignName = campaign.name;
                if(post.actionId) {
                    const action = campaign.actions.find(a => a.id === post.actionId);
                    if (action) {
                        actionName = action.name;
                        if(post.activityId) {
                            const activity = action.activities.find(act => act.id === post.activityId);
                            activityName = activity?.name;
                        }
                    }
                }
            }
        }
        return {
            ...post,
            campaignName,
            actionName,
            activityName,
        };
    }).sort((a, b) => new Date(b.publicationDate).getTime() - new Date(b.publicationDate).getTime());
}


export async function getSocialPostsForAction(actionId: string): Promise<SocialPost[]> {
    const allPosts = await getSocialPosts();
    return allPosts.filter(post => post.actionId === actionId);
}

export async function getSocialPostsForCampaign(campaignId: string): Promise<SocialPost[]> {
    const allPosts = await getSocialPosts();
    return allPosts.filter(post => post.campaignId === campaignId);
}

export async function getSocialPostById(postId: string): Promise<SocialPost | undefined> {
    const postRef = doc(db, "socialPosts", postId);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
        return { id: postSnap.id, ...postSnap.data() } as SocialPost;
    }
    return undefined;
}

export async function deleteSocialPost(postId: string) {
    const postRef = doc(db, "socialPosts", postId);
    await deleteDoc(postRef);
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

            updatedExpense.status = action.generalExpenses[expenseIndex].status || 'planned';
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
            if (!campaignDoc.exists()) throw new Error("Campaign not found");
            
            const campaignData = campaignDoc.data() as Campaign;
            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            if (actionIndex === -1) throw new Error("Action not found");

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

export async function updateActionEffectiveness(campaignId: string, actionId: string, data: { plannedAverageCheck: number, actualAverageCheck: number, plannedMarginality: number, actualMarginality: number }) {
    const campaignRef = doc(db, 'campaigns', campaignId);

    try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) throw new Error("Campaign document does not exist!");

            const campaignData = campaignDoc.data() as Campaign;
            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            if (actionIndex === -1) throw new Error("Action not found!");

            const newActions = [...campaignData.actions];
            newActions[actionIndex].plannedAverageCheck = data.plannedAverageCheck;
            newActions[actionIndex].actualAverageCheck = data.actualAverageCheck;
            newActions[actionIndex].plannedMarginality = data.plannedMarginality;
            newActions[actionIndex].actualMarginality = data.actualMarginality;

            transaction.update(campaignRef, { actions: newActions });
        });
    } catch (e) {
        console.error("Update effectiveness data transaction failed: ", e);
        throw e;
    }
}

export async function updateActionStatus(campaignId: string, actionId: string, status: ActionStatus) {
    const campaignRef = doc(db, 'campaigns', campaignId);
    try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) throw new Error("Campaign document does not exist!");

            const campaignData = campaignDoc.data() as Campaign;
            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            if (actionIndex === -1) throw new Error("Action not found!");

            const newActions = [...campaignData.actions];
            newActions[actionIndex].status = status;

            transaction.update(campaignRef, { actions: newActions });
        });
    } catch (e) {
        console.error("Update status transaction failed: ", e);
        throw e;
    }
}

export async function updateCampaignStatus(campaignId: string, status: CampaignStatus) {
    const campaignRef = doc(db, 'campaigns', campaignId);
    try {
        await updateDoc(campaignRef, { status: status });
    } catch (e) {
        console.error("Update campaign status failed: ", e);
        throw e;
    }
}

export async function createCampaign(data: Partial<Omit<Campaign, 'id' | 'actions' | 'goals'>>) {
    const newCampaign: Omit<Campaign, 'id'> = {
        name: data.name || 'Новая кампания',
        description: data.description || '',
        budget: data.budget || 0,
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        endDate: data.endDate || new Date().toISOString().split('T')[0],
        status: 'planned',
        goals: [],
        actions: [],
    };
    try {
        await addDoc(collection(db, "campaigns"), newCampaign);
    } catch (e) {
        console.error("Create campaign failed: ", e);
        throw e;
    }
}

export async function updateCampaign(campaignId: string, data: Partial<Omit<Campaign, 'id' | 'actions' | 'goals'>>) {
    const campaignRef = doc(db, 'campaigns', campaignId);
    try {
        await updateDoc(campaignRef, data);
    } catch (e) {
        console.error("Update campaign failed: ", e);
        throw e;
    }
}

export async function deleteCampaign(campaignId: string) {
    const campaignRef = doc(db, 'campaigns', campaignId);
    try {
        await deleteDoc(campaignRef);
    } catch (e) {
        console.error("Delete campaign failed: ", e);
        throw e;
    }
}

export async function clearDatabase() {
    const batch = writeBatch(db);
    
    // Delete all campaigns
    const campaignsCollection = collection(db, "campaigns");
    const campaignsSnapshot = await getDocs(campaignsCollection);
    if (!campaignsSnapshot.empty) {
        campaignsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    }
    
    // Delete all social posts
    const postsCollection = collection(db, "socialPosts");
    const postsSnapshot = await getDocs(postsCollection);
    if (!postsSnapshot.empty) {
        postsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    }

    try {
        await batch.commit();
    } catch (e) {
        console.error("Batch deletion failed: ", e);
        throw new Error("Failed to clear database.");
    }
}

export async function editKpiMetric(campaignId: string, actionId: string, activityId: string, kpiId: string, updatedMetric: KpiMetricLog) {
    const campaignRef = doc(db, 'campaigns', campaignId);
    try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) throw new Error("Campaign not found");
            const campaignData = campaignDoc.data() as Campaign;
            
            const action = campaignData.actions.find(a => a.id === actionId);
            if (!action) throw new Error("Action not found");

            const activity = action.activities.find(a => a.id === activityId);
            if (!activity) throw new Error("Activity not found");

            const kpi = activity.kpis.find(k => k.id === kpiId);
            if (!kpi || !kpi.metrics) throw new Error("KPI or its metrics not found");

            const metricIndex = kpi.metrics.findIndex(m => m.id === updatedMetric.id);
            if (metricIndex === -1) throw new Error("Metric log not found");

            kpi.metrics[metricIndex] = updatedMetric;

            transaction.update(campaignRef, { actions: campaignData.actions });
        });
    } catch(e) {
        console.error("Edit KPI Metric transaction failed: ", e);
        throw e;
    }
}

export async function deleteKpiMetric(campaignId: string, actionId: string, activityId: string, kpiId: string, logId: string) {
    const campaignRef = doc(db, 'campaigns', campaignId);
     try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) throw new Error("Campaign not found");
            const campaignData = campaignDoc.data() as Campaign;
            
            const action = campaignData.actions.find(a => a.id === actionId);
            if (!action) throw new Error("Action not found");

            const activity = action.activities.find(a => a.id === activityId);
            if (!activity) throw new Error("Activity not found");

            const kpi = activity.kpis.find(k => k.id === kpiId);
            if (!kpi || !kpi.metrics) throw new Error("KPI or its metrics not found");

            kpi.metrics = kpi.metrics.filter(m => m.id !== logId);

            transaction.update(campaignRef, { actions: campaignData.actions });
        });
    } catch(e) {
        console.error("Delete KPI Metric transaction failed: ", e);
        throw e;
    }
}


export async function updateActionResponsibility(campaignId: string, actionId: string, data: Partial<Pick<Action, 'responsiblePerson' | 'marketingHead' | 'financeHead' | 'itHead' | 'curator' | 'salesHead'>>) {
    const campaignRef = doc(db, 'campaigns', campaignId);
    try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) throw new Error("Campaign not found");
            const campaignData = campaignDoc.data() as Campaign;
            
            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            if (actionIndex === -1) throw new Error("Action not found");

            const newActions = [...campaignData.actions];
            newActions[actionIndex] = { ...newActions[actionIndex], ...data };

            transaction.update(campaignRef, { actions: newActions });
        });
    } catch(e) {
        console.error("Update action responsibility transaction failed: ", e);
        throw e;
    }
}


export async function updateActionConditions(campaignId: string, actionId: string, conditions: string) {
    const campaignRef = doc(db, 'campaigns', campaignId);
    try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) throw new Error("Campaign document does not exist!");

            const campaignData = campaignDoc.data() as Campaign;
            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            if (actionIndex === -1) throw new Error("Action not found in this campaign!");

            const newActions = [...campaignData.actions];
            newActions[actionIndex].conditions = conditions;

            transaction.update(campaignRef, { actions: newActions });
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw new Error('Failed to update action conditions.');
    }
}

export async function updateActionMechanics(campaignId: string, actionId: string, mechanics: string) {
    const campaignRef = doc(db, 'campaigns', campaignId);
    try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) throw new Error("Campaign document does not exist!");

            const campaignData = campaignDoc.data() as Campaign;
            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            if (actionIndex === -1) throw new Error("Action not found in this campaign!");

            const newActions = [...campaignData.actions];
            newActions[actionIndex].mechanics = mechanics;

            transaction.update(campaignRef, { actions: newActions });
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw new Error('Failed to update action mechanics.');
    }
}


export async function addResourceToAction(campaignId: string, actionId: string, resource: Omit<Resource, 'id'>) {
    const campaignRef = doc(db, 'campaigns', campaignId);
    try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) throw new Error("Campaign not found");
            const campaignData = campaignDoc.data() as Campaign;

            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            if (actionIndex === -1) throw new Error("Action not found");

            const newActions = [...campaignData.actions];
            if (!newActions[actionIndex].resources) {
                newActions[actionIndex].resources = [];
            }
            
            const newResource: Resource = {
                ...resource,
                id: `res-${actionId.substring(0, 4)}-${Date.now()}`,
            };

            newActions[actionIndex].resources!.push(newResource);
            transaction.update(campaignRef, { actions: newActions });
        });
    } catch (e) {
        console.error("Add resource transaction failed:", e);
        throw e;
    }
}

export async function updateResourceInAction(campaignId: string, actionId: string, resource: Resource) {
    const campaignRef = doc(db, 'campaigns', campaignId);
    try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) throw new Error("Campaign not found");
            const campaignData = campaignDoc.data() as Campaign;

            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            if (actionIndex === -1) throw new Error("Action not found");

            const newActions = [...campaignData.actions];
            const resources = newActions[actionIndex].resources || [];
            const resourceIndex = resources.findIndex(r => r.id === resource.id);
            if (resourceIndex === -1) throw new Error("Resource not found");

            resources[resourceIndex] = resource;
            newActions[actionIndex].resources = resources;
            transaction.update(campaignRef, { actions: newActions });
        });
    } catch (e) {
        console.error("Update resource transaction failed:", e);
        throw e;
    }
}

export async function deleteResourceFromAction(campaignId: string, actionId: string, resourceId: string) {
    const campaignRef = doc(db, 'campaigns', campaignId);
    try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) throw new Error("Campaign not found");
            const campaignData = campaignDoc.data() as Campaign;

            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            if (actionIndex === -1) throw new Error("Action not found");

            const newActions = [...campaignData.actions];
            const resources = newActions[actionIndex].resources || [];
            newActions[actionIndex].resources = resources.filter(r => r.id !== resourceId);
            transaction.update(campaignRef, { actions: newActions });
        });
    } catch (e) {
        console.error("Delete resource transaction failed:", e);
        throw e;
    }
}

export async function updateResourceStatus(campaignId: string, actionId: string, resourceId: string, status: ResourceStatus) {
    const campaignRef = doc(db, 'campaigns', campaignId);
    try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) throw new Error("Campaign not found");
            const campaignData = campaignDoc.data() as Campaign;

            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            if (actionIndex === -1) throw new Error("Action not found");

            const newActions = [...campaignData.actions];
            const resources = newActions[actionIndex].resources || [];
            const resourceIndex = resources.findIndex(r => r.id === resourceId);
            if (resourceIndex === -1) throw new Error("Resource not found");

            resources[resourceIndex].status = status;
            newActions[actionIndex].resources = resources;
            transaction.update(campaignRef, { actions: newActions });
        });
    } catch (e) {
        console.error("Update resource status transaction failed:", e);
        throw e;
    }
}


export async function updateExpenseStatus(campaignId: string, actionId: string, expenseId: string, activityId: string, status: ExpenseStatus) {
    const campaignRef = doc(db, 'campaigns', campaignId);
    try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) throw new Error("Campaign not found");
            const campaignData = campaignDoc.data() as Campaign;

            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            if (actionIndex === -1) throw new Error("Action not found");

            const newActions = [...campaignData.actions];
            const action = newActions[actionIndex];
            
            if (activityId === 'general') {
                const expenseIndex = action.generalExpenses.findIndex(e => e.id === expenseId);
                if (expenseIndex === -1) throw new Error("General expense not found");
                action.generalExpenses[expenseIndex].status = status;
            } else {
                const activityIndex = action.activities.findIndex(a => a.id === activityId);
                if (activityIndex === -1) throw new Error("Activity not found");
                const expenseIndex = action.activities[activityIndex].expenses.findIndex(e => e.id === expenseId);
                if (expenseIndex === -1) throw new Error("Activity expense not found");
                action.activities[activityIndex].expenses[expenseIndex].status = status;
            }

            transaction.update(campaignRef, { actions: newActions });
        });
    } catch (e) {
        console.error("Update expense status transaction failed:", e);
        throw e;
    }
}

export async function deleteAction(campaignId: string, actionId: string) {
  const campaignRef = doc(db, "campaigns", campaignId);
  try {
    await runTransaction(db, async (transaction) => {
      const campaignDoc = await transaction.get(campaignRef);
      if (!campaignDoc.exists()) {
        throw new Error("Campaign document does not exist!");
      }

      const campaignData = campaignDoc.data() as Campaign;
      const updatedActions = campaignData.actions.filter(
        (a) => a.id !== actionId
      );

      transaction.update(campaignRef, { actions: updatedActions });
    });
  } catch (e) {
    console.error("Transaction failed: ", e);
    throw new Error("Failed to delete action.");
  }
}

export async function restoreDatabase(campaigns: Campaign[], socialPosts: SocialPost[], tasks: Task[]) {
    await clearDatabase();
    
    const batch = writeBatch(db);

    campaigns.forEach(campaign => {
        const campaignRef = doc(db, "campaigns", campaign.id);
        batch.set(campaignRef, campaign);
    });
    
    socialPosts.forEach(post => {
        const postRef = doc(db, "socialPosts", post.id);
        batch.set(postRef, post);
    });

    tasks.forEach(task => {
        const taskRef = doc(db, "tasks", task.id);
        batch.set(taskRef, task);
    });

    try {
        await batch.commit();
    } catch (e) {
        console.error("Batch restore failed: ", e);
        throw new Error("Failed to restore database from backup.");
    }
}

export async function getAllTasks(): Promise<EnrichedTask[]> {
  const tasksCollection = collection(db, "tasks");
  const tasksSnapshot = await getDocs(tasksCollection);
  const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
  
  if (tasks.length === 0) return [];
  
  const campaigns = await getCampaigns();
  
  return tasks.map(task => {
      let campaignName: string | undefined;
      let actionName: string | undefined;
      let activityName: string | undefined;
      
      if (task.campaignId) {
          const campaign = campaigns.find(c => c.id === task.campaignId);
          campaignName = campaign?.name;
          if (campaign && task.actionId) {
              const action = campaign.actions.find(a => a.id === task.actionId);
              actionName = action?.name;
              if (action && task.activityId) {
                  const activity = action.activities.find(act => act.id === task.activityId);
                  activityName = activity?.name;
              }
          }
      }
      
      return {
          ...task,
          campaignName,
          actionName,
          activityName,
      }
  }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
}

export async function addTask(data: Omit<Task, 'id' | 'createdAt' | 'isArchived'>) {
    const newTask: Omit<Task, 'id'> = {
        ...data,
        createdAt: new Date().toISOString(),
        isArchived: false,
    };
    await addDoc(collection(db, "tasks"), newTask);
}

export async function updateTask(taskId: string, data: Partial<Task>) {
    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, data);
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, { status });
}

export async function deleteTask(taskId: string) {
    const taskRef = doc(db, "tasks", taskId);
    await deleteDoc(taskRef);
}

export async function getUpcomingEvents(days: number): Promise<UpcomingEvent[]> {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);

  const allTasks = await getAllTasks();
  const allPosts = await getAllSocialPosts();

  const upcomingTasks = allTasks
    .filter(task => {
      const taskDate = new Date(task.deadline);
      return taskDate >= today && taskDate <= futureDate && !task.isArchived && task.status !== 'completed';
    })
    .map(task => ({
      type: 'task' as const,
      date: task.deadline,
      title: task.title,
      id: task.id,
      status: task.status,
      details: `Отв: ${task.responsiblePerson}`,
      link: `/tasks`
    }));

  const upcomingPosts = allPosts
    .filter(post => {
      const postDate = new Date(post.publicationDate);
      return postDate >= today && postDate <= futureDate && post.status !== 'published';
    })
    .map(post => ({
      type: 'post' as const,
      date: post.publicationDate,
      title: post.title,
      id: post.id,
      status: post.status,
      details: post.campaignName ? `Кампания: ${post.campaignName}` : 'Общий пост',
      link: post.campaignId && post.actionId ? `/campaigns/${post.campaignId}/${post.actionId}` : (post.campaignId ? `/campaigns/${post.campaignId}` : '/smm'),
    }));
    
  const allEvents = [...upcomingTasks, ...upcomingPosts];
  
  return allEvents.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function updateActionSalesKpiName(campaignId: string, actionId: string, salesKpiName: string) {
    const campaignRef = doc(db, 'campaigns', campaignId);
    try {
        await runTransaction(db, async (transaction) => {
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists()) throw new Error("Campaign document does not exist!");

            const campaignData = campaignDoc.data() as Campaign;
            const actionIndex = campaignData.actions.findIndex(a => a.id === actionId);
            if (actionIndex === -1) throw new Error("Action not found in this campaign!");

            const newActions = [...campaignData.actions];
            newActions[actionIndex].salesKpiName = salesKpiName;

            transaction.update(campaignRef, { actions: newActions });
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw new Error('Failed to update sales KPI name.');
    }
}
