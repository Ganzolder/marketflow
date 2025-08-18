

"use server";

import { z } from "zod";
import { createCampaign as createCampaignData, addAction, updateAction, addActivity, updateActivity as updateActivityData, deleteActivity as deleteActivityData, updateActivityMetrics as updateActivityMetricsData, addExpenseToActivity as addExpenseToActivityData, updateExpense as updateExpenseData, deleteExpenseFromActivity, addGeneralExpenseToAction, updateGeneralExpenseInAction, deleteGeneralExpenseFromAction, updateActionSummaryKpis as updateActionSummaryKpisData, updateActionEffectiveness as updateActionEffectivenessData, updateActionStatus as updateActionStatusData, updateCampaignStatus as updateCampaignStatusData, updateCampaign as updateCampaignData, deleteCampaign as deleteCampaignData, editKpiMetric as editKpiMetricData, deleteKpiMetric as deleteKpiMetricData, updateActionResponsibility as updateActionResponsibilityData, updateActionConditions as updateActionConditionsData, addResourceToAction as addResourceToActionData, updateResourceInAction as updateResourceInActionData, deleteResourceFromAction, updateResourceStatus as updateResourceStatusData, updateExpenseStatus as updateExpenseStatusData, getSocialPostById, deleteSocialPost as deleteSocialPostData, getSocialPostsForAction, clearDatabase as clearDatabaseData, deleteAction as deleteActionData, getCampaigns, getAllSocialPosts, restoreDatabase, getAllTasks, addTask as addTaskData, updateTask as updateTaskData, deleteTask as deleteTaskData } from "./data";
import { revalidatePath } from "next/cache";
import type { Action, Activity, KPI, Expense, ActionStatus, CampaignStatus, KpiMetricLog, Campaign, ResponsibilityFormState, Resource, ResourceStatus, ResourceStatusFormState, ExpenseStatus, ExpenseStatusFormState, SocialPost, SocialPlatform, SocialPostStatus, SocialPostMetricsFormState, AiSocialPost, TaskFormState, Task } from "./types";
import { analyzeActionPerformance, type AnalyzeActionPerformanceOutput } from "@/ai/flows/analyze-action-performance";
import { generatePostText, type GeneratePostTextInput } from "@/ai/flows/generate-post-text";
import { addDoc, collection, doc, updateDoc, getDoc, deleteField } from "firebase/firestore";
import { db } from "./firebase";
import { redirect } from 'next/navigation';
import * as XLSX from 'xlsx';

const ActionSchema = z.object({
  name: z.string().min(3, { message: "Название акции должно содержать не менее 3 символов." }),
  description: z.string().optional(),
  targetAudience: z.string().optional(),
  conditions: z.string().optional(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Неверный формат даты начала." }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Неверный формат даты окончания." }),
  status: z.enum(['planned', 'in-progress', 'completed']),
  campaignId: z.string(),
});

const AddActionSchema = ActionSchema.extend({
});

const EditActionSchema = ActionSchema.extend({
  id: z.string(),
});

export type ActionFormState = {
  message: string;
  errors?: {
    name?: string[];
    description?: string[];
    targetAudience?: string[];
    conditions?: string[];
    startDate?: string[];
    endDate?: string[];
    status?: string[];
    campaignId?: string[];
    id?: string[];
    responsiblePerson?: string[];
    marketingHead?: string[];
    financeHead?: string[];
    itHead?: string[];
    curator?: string[];
    salesHead?: string[];
  };
};

export async function addActionToCampaign(
  prevState: ActionFormState | null,
  formData: FormData
): Promise<ActionFormState> {
  
  const validatedFields = AddActionSchema.safeParse({
    name: formData.get('action-name'),
    description: formData.get('description'),
    targetAudience: formData.get('target-audience'),
    conditions: formData.get('conditions'),
    startDate: formData.get('start-date'),
    endDate: formData.get('end-date'),
    status: formData.get('status'),
    campaignId: formData.get('campaignId'),
  });

  if (!validatedFields.success) {
    const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors).flat().join("\n");
    return {
      message: `Ошибка валидации: ${errorMessages}`,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { campaignId, status, ...actionData } = validatedFields.data;

  try {
    await addAction(campaignId, { ...actionData, status: status as 'planned' | 'in-progress' | 'completed' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка.";
    return { message: `Ошибка базы данных: не удалось создать акцию. ${errorMessage}` };
  }

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath('/actions');
  return { message: "Акция успешно добавлена." };
}

export async function editActionInCampaign(
  prevState: ActionFormState,
  formData: FormData
): Promise<ActionFormState> {
  
  const rawData = {
    id: formData.get('actionId'),
    name: formData.get('action-name'),
    description: formData.get('description') || '',
    targetAudience: formData.get('target-audience') || '',
    startDate: formData.get('start-date'),
    endDate: formData.get('end-date'),
    status: formData.get('status'),
    campaignId: formData.get('campaignId'),
    conditions: formData.get('conditions') || '',
  };

  const validatedFields = EditActionSchema.safeParse(rawData);

  if (!validatedFields.success) {
    const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors).flat().join("\n");
    return {
        message: `Ошибка валидации: ${errorMessages}`,
        errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { campaignId, ...actionData } = validatedFields.data;

  try {
    await updateAction(campaignId, actionData as Action);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка.";
    return { message: `Ошибка базы данных: не удалось обновить акцию. ${errorMessage}` };
  }

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath(`/campaigns/${campaignId}/${actionData.id}`);
  revalidatePath('/actions');
  return { message: "Акция успешно обновлена." };
}

// --- Activity Actions ---

const KpiSchemaBase = z.object({
    id: z.string(),
    name: z.string().min(1, "Название KPI обязательно."),
    target: z.coerce.number().min(0, "Цель должна быть 0 или больше."),
    parentId: z.string().nullable(),
    includeInActionGoals: z.boolean(),
    multiplicity: z.coerce.number().min(1, "Кратность должна быть не меньше 1."),
});


const EditKpiSchema = KpiSchemaBase;


const ActivitySchema = z.object({
  name: z.string().min(3, { message: "Название активности должно содержать не менее 3 символов." }),
  description: z.string().optional(),
  trackingMethod: z.string().optional(),
  budget: z.coerce.number().min(0, { message: "Бюджет не может быть отрицательным." }),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Неверный формат даты начала." }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Неверный формат даты окончания." }),
  campaignId: z.string(),
  actionId: z.string(),
});

const AddActivitySchema = ActivitySchema.extend({
    kpis: z.array(KpiSchemaBase).optional(),
});

const EditActivitySchema = ActivitySchema.extend({
  id: z.string(),
  kpis: z.array(EditKpiSchema).optional(),
});

const DeleteActivitySchema = z.object({
  campaignId: z.string(),
  actionId: z.string(),
  activityId: z.string(),
});


export type ActivityFormState = {
  message: string;
  error?: boolean;
  errors?: {
    name?: string[];
    description?: string[];
    trackingMethod?: string[];
    budget?: string[];
    startDate?: string[];
    endDate?: string[];
    kpis?: string[];
    id?: string[];
  };
};

export type DeleteFormState = {
    message: string;
    error?: boolean;
};

export async function addActivityToAction(
  prevState: ActivityFormState | null,
  formData: FormData
): Promise<ActivityFormState> {
  
  const kpisString = formData.get('kpis') as string;
  let kpis = [];
  try {
    kpis = kpisString ? JSON.parse(kpisString) : [];
  } catch (e) {
    return { message: 'Не удалось обработать данные KPI.', error: true };
  }

  const processedKpis = kpis.map((kpi: any) => ({
      ...kpi,
      target: Number(kpi.target) || 0,
      parentId: kpi.parentId ?? null,
      includeInActionGoals: kpi.includeInActionGoals ?? true,
      multiplicity: Number(kpi.multiplicity) || 1,
  }));

  const validatedFields = AddActivitySchema.safeParse({
    name: formData.get('activity-name'),
    description: formData.get('description'),
    trackingMethod: formData.get('trackingMethod'),
    budget: formData.get('budget'),
    startDate: formData.get('start-date'),
    endDate: formData.get('end-date'),
    kpis: processedKpis,
    campaignId: formData.get('campaignId'),
    actionId: formData.get('actionId'),
  });

  if (!validatedFields.success) {
    return {
      message: "Ошибка валидации. Не удалось создать активность.",
      errors: validatedFields.error.flatten().fieldErrors,
      error: true,
    };
  }
  
  const { campaignId, actionId, ...activityData } = validatedFields.data;
  
  const activityToSave = {
      ...activityData,
      spent: 0,
      expenses: [],
      kpis: activityData.kpis?.map(kpi => ({
          ...kpi, 
          current: 0, 
          metrics: [],
        })) || [] 
  }

  try {
    await addActivity(campaignId, actionId, activityToSave as Omit<Activity, 'id'>);
  } catch (error) {
     const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка.";
    return { message: `Ошибка базы данных: не удалось создать активность. ${errorMessage}`, error: true };
  }

  revalidatePath(`/campaigns/${campaignId}/${actionId}`);
  revalidatePath('/activities');
  return { message: "Активность успешно добавлена." };
}


export async function updateActivity(
  activityId: string,
  existingKpis: KPI[],
  prevState: ActivityFormState,
  formData: FormData
): Promise<ActivityFormState> {

  const kpisString = formData.get('kpis') as string;
  let kpisFromForm = [];
  try {
      kpisFromForm = kpisString ? JSON.parse(kpisString) : [];
  } catch (e) {
      return { message: 'Не удалось обработать данные KPI.', error: true };
  }

  const processedKpis = kpisFromForm.map((kpi: any) => {
    const originalKpi = existingKpis.find(ek => ek.id === kpi.id);
    return {
        id: kpi.id,
        name: kpi.name,
        target: Number(kpi.target) || 0,
        current: originalKpi?.current || 0, 
        metrics: originalKpi?.metrics || [],
        parentId: kpi.parentId ?? null,
        includeInActionGoals: kpi.includeInActionGoals ?? true,
        multiplicity: Number(kpi.multiplicity) || 1,
    };
  });
  
  const validatedFields = EditActivitySchema.safeParse({
    name: formData.get('activity-name'),
    description: formData.get('description'),
    trackingMethod: formData.get('trackingMethod'),
    budget: formData.get('budget'),
    startDate: formData.get('start-date'),
    endDate: formData.get('end-date'),
    kpis: processedKpis,
    campaignId: formData.get('campaignId'),
    actionId: formData.get('actionId'),
    id: activityId,
  });

  if (!validatedFields.success) {
    console.error(validatedFields.error.flatten());
    return {
      message: "Ошибка валидации. Не удалось обновить активность.",
      errors: validatedFields.error.flatten().fieldErrors,
      error: true,
    };
  }
  
  const { campaignId, actionId, id, ...activityData } = validatedFields.data;
  
  const activityUpdateData = {
      ...activityData
  };

  try {
    await updateActivityData(campaignId, actionId, { id, ...activityUpdateData } as Activity);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
    return { message: `Ошибка базы данных: не удалось обновить активность. ${errorMessage}`, error: true };
  }

  revalidatePath(`/campaigns/${campaignId}/${actionId}`);
  revalidatePath('/activities');
  return { message: "Активность успешно обновлена." };
}

export async function deleteActivity(prevState: DeleteFormState | null, formData: FormData): Promise<DeleteFormState> {
    const validatedFields = DeleteActivitySchema.safeParse({
        campaignId: formData.get('campaignId'),
        actionId: formData.get('actionId'),
        activityId: formData.get('activityId'),
    });

    if (!validatedFields.success) {
        return {
            message: "Ошибка валидации: не удалось получить необходимые ID.",
            error: true,
        };
    }

    const { campaignId, actionId, activityId } = validatedFields.data;

    try {
        await deleteActivityData(campaignId, actionId, activityId);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка базы данных: не удалось удалить активность. ${errorMessage}`, error: true };
    }

    revalidatePath(`/campaigns/${campaignId}/${actionId}`);
    revalidatePath('/activities');
    return { message: "Активность успешно удалена." };
}


const UpdateMetricsSchema = z.object({
  campaignId: z.string(),
  actionId: z.string(),
  activityId: z.string(),
  kpis: z.record(z.string(), z.coerce.number().min(0)).optional()
});

export type MetricsFormState = {
  message: string;
  error?: boolean;
};

export async function updateActivityMetrics(
  prevState: MetricsFormState | null,
  formData: FormData
): Promise<MetricsFormState> {
    const kpiUpdates: Record<string, number> = {};
    for (const [key, value] of formData.entries()) {
        if (key.startsWith('kpi-')) {
            const kpiId = key.replace('kpi-', '');
            if (value && parseFloat(value as string) > 0) { // only include if value is provided and positive
                kpiUpdates[kpiId] = parseFloat(value as string);
            }
        }
    }
    
    if (Object.keys(kpiUpdates).length === 0) {
        return { message: "Данные для обновления не предоставлены.", error: true };
    }


    const validatedFields = UpdateMetricsSchema.safeParse({
        campaignId: formData.get('campaignId'),
        actionId: formData.get('actionId'),
        activityId: formData.get('activityId'),
        kpis: kpiUpdates
    });
    
    if (!validatedFields.success) {
        return {
            message: "Ошибка валидации: не удалось обновить метрики.",
            error: true,
        };
    }

    const { campaignId, actionId, activityId, kpis } = validatedFields.data;

    try {
        await updateActivityMetricsData(campaignId, actionId, activityId, kpis || {});
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
    }

    revalidatePath(`/campaigns/${campaignId}/${actionId}`);
    revalidatePath('/actions');
    revalidatePath('/activities');
    return { message: "Метрики успешно обновлены." };
}

const AddExpenseSchema = z.object({
  description: z.string().min(1, "Описание обязательно."),
  amount: z.coerce.number().gt(0, "Сумма должна быть больше нуля."),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Неверный формат даты."),
  legalEntity: z.string().optional(),
  photoURL: z.string().url("Неверный URL-адрес фотографии.").or(z.literal('')).optional(),
});


const UpdateExpenseSchema = AddExpenseSchema.extend({
    expenseId: z.string(),
    campaignId: z.string(),
    actionId: z.string(),
    newActivityId: z.string(), // Can be 'general' or an activity ID
    originalActivityId: z.string(), // Can be 'general' or an activity ID
});


const DeleteActivityExpenseSchema = z.object({
    campaignId: z.string(),
    actionId: z.string(),
    activityId: z.string(),
    expenseId: z.string(),
});

const GeneralExpenseSchema = AddExpenseSchema.extend({
  campaignId: z.string(),
  actionId: z.string(),
  activityId: z.string().optional(), // Can be general or attached to an activity
});

const DeleteGeneralExpenseSchema = z.object({
    campaignId: z.string(),
    actionId: z.string(),
    expenseId: z.string(),
});


export type ExpenseFormState = {
  message: string;
  error?: boolean;
  errors?: z.ZodError<z.infer<typeof AddExpenseSchema>>['formErrors']['fieldErrors']
};

export async function addExpense(prevState: ExpenseFormState | null, formData: FormData): Promise<ExpenseFormState> {
    
    const validatedFields = GeneralExpenseSchema.safeParse({
        campaignId: formData.get('campaignId'),
        actionId: formData.get('actionId'),
        activityId: formData.get('activityId'), // This is from the add-expense-button, not the general one
        description: formData.get('description'),
        amount: formData.get('amount'),
        date: formData.get('date'),
        legalEntity: formData.get('legalEntity'),
        photoURL: formData.get('photoURL'),
    });

    if (!validatedFields.success) {
        const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors).flat().join("\n");
        return {
            message: `Ошибка валидации: ${errorMessages}`,
            error: true,
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { campaignId, actionId, activityId, ...expenseData } = validatedFields.data;

    try {
       await addExpenseToActivityData(campaignId, actionId, activityId!, {...expenseData, status: 'planned'});
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
    }

    revalidatePath(`/campaigns/${campaignId}/${actionId}`);
    return { message: "Расход успешно добавлен." };
}

export async function updateExpense(prevState: ExpenseFormState | null, formData: FormData): Promise<ExpenseFormState> {
    const validatedFields = UpdateExpenseSchema.safeParse({
        expenseId: formData.get('expenseId'),
        campaignId: formData.get('campaignId'),
        actionId: formData.get('actionId'),
        originalActivityId: formData.get('originalActivityId'),
        newActivityId: formData.get('activityId'),
        description: formData.get('description'),
        amount: formData.get('amount'),
        date: formData.get('date'),
        legalEntity: formData.get('legalEntity'),
        photoURL: formData.get('photoURL'),
    });

    if (!validatedFields.success) {
        const errorMessages = validatedFields.error.issues.map((issue) => issue.message).join("\n");
        return {
            message: `Ошибка валидации: ${errorMessages}`,
            error: true,
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    const { campaignId, actionId, expenseId, originalActivityId, newActivityId, ...expenseData } = validatedFields.data;
    const expenseToUpdate: Expense = { id: expenseId, ...expenseData, status: 'planned' }; // Status is not editable here, so we get it from original or default

    try {
        await updateExpenseData(campaignId, actionId, expenseToUpdate, originalActivityId, newActivityId);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
    }

    revalidatePath(`/campaigns/${campaignId}/${actionId}`);
    return { message: "Расход успешно обновлен." };
}

export async function deleteExpense(prevState: DeleteFormState | null, formData: FormData): Promise<DeleteFormState> {
    const validatedFields = DeleteActivityExpenseSchema.safeParse({
        campaignId: formData.get('campaignId'),
        actionId: formData.get('actionId'),
        activityId: formData.get('activityId'),
        expenseId: formData.get('expenseId'),
    });
    
    if (!validatedFields.success) {
        return {
            message: "Ошибка валидации: не удалось получить необходимые ID.",
            error: true,
        };
    }

    const { campaignId, actionId, activityId, expenseId } = validatedFields.data;

    try {
        await deleteExpenseFromActivity(campaignId, actionId, activityId, expenseId);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
    }

    revalidatePath(`/campaigns/${campaignId}/${actionId}`);
    return { message: "Расход успешно удален." };
}

export async function addGeneralExpense(prevState: ExpenseFormState | null, formData: FormData): Promise<ExpenseFormState> {
    const rawActivityId = formData.get('activityId');

    const validatedFields = GeneralExpenseSchema.safeParse({
        campaignId: formData.get('campaignId'),
        actionId: formData.get('actionId'),
        activityId: rawActivityId === 'general' ? undefined : rawActivityId,
        description: formData.get('description'),
        amount: formData.get('amount'),
        date: formData.get('date'),
        legalEntity: formData.get('legalEntity'),
        photoURL: formData.get('photoURL'),
    });

    if (!validatedFields.success) {
        const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors).flat().join("\n");
        return {
            message: `Ошибка валидации: ${errorMessages}`,
            error: true,
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { campaignId, actionId, activityId, ...expenseData } = validatedFields.data;

    try {
        if (activityId) {
             // Add to a specific activity
            await addExpenseToActivityData(campaignId, actionId, activityId, {...expenseData, status: 'planned'});
        } else {
            // Add as a general expense
            await addGeneralExpenseToAction(campaignId, actionId, {...expenseData, status: 'planned'});
        }
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
    }

    revalidatePath(`/campaigns/${campaignId}/${actionId}`);
    return { message: "Расход успешно добавлен." };
}


export async function deleteGeneralExpense(prevState: DeleteFormState | null, formData: FormData): Promise<DeleteFormState> {
    const validatedFields = DeleteGeneralExpenseSchema.safeParse({
        campaignId: formData.get('campaignId'),
        actionId: formData.get('actionId'),
        expenseId: formData.get('expenseId'),
    });
    
    if (!validatedFields.success) {
        return {
            message: "Ошибка валидации: не удалось получить необходимые ID.",
            error: true,
        };
    }

    const { campaignId, actionId, expenseId } = validatedFields.data;

    try {
        await deleteGeneralExpenseFromAction(campaignId, actionId, expenseId);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
    }

    revalidatePath(`/campaigns/${campaignId}/${actionId}`);
    return { message: "Общий расход успешно удален." };
}


const UpdateSummaryKpisSchema = z.object({
  campaignId: z.string(),
  actionId: z.string(),
  summaryKpis: z.array(z.string()).optional(),
});

export type SummaryKpiFormState = {
  message: string;
  error?: boolean;
};

export async function updateActionSummaryKpis(
  prevState: SummaryKpiFormState | null,
  formData: FormData
): Promise<SummaryKpiFormState> {
    const kpiNames = Array.from(formData.keys()).filter(key => key !== 'campaignId' && key !== 'actionId');
    
    const validatedFields = UpdateSummaryKpisSchema.safeParse({
        campaignId: formData.get('campaignId'),
        actionId: formData.get('actionId'),
        summaryKpis: kpiNames,
    });

    if (!validatedFields.success) {
        return {
            message: "Ошибка валидации.",
            error: true,
        };
    }

    const { campaignId, actionId, summaryKpis } = validatedFields.data;

    try {
        await updateActionSummaryKpisData(campaignId, actionId, summaryKpis || []);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
    }

    revalidatePath(`/campaigns/${campaignId}/${actionId}`);
    revalidatePath(`/campaigns/${campaignId}`); // Also revalidate the campaign page
    revalidatePath('/actions');
    return { message: "Настройки отображения KPI обновлены." };
}

const UpdateEffectivenessSchema = z.object({
  campaignId: z.string(),
  actionId: z.string(),
  plannedAverageCheck: z.coerce.number().min(0, "Средний чек не может быть отрицательным.").optional().or(z.literal('')),
  actualAverageCheck: z.coerce.number().min(0, "Средний чек не может быть отрицательным.").optional().or(z.literal('')),
  plannedMarginality: z.coerce.number().min(0, "Маржинальность не может быть отрицательной.").max(100, "Маржинальность не может быть больше 100.").optional().or(z.literal('')),
  actualMarginality: z.coerce.number().min(0, "Маржинальность не может быть отрицательной.").max(100, "Маржинальность не может быть больше 100.").optional().or(z.literal('')),
});


export type EffectivenessFormState = {
  message: string;
  error?: boolean;
  errors?: z.ZodError<z.infer<typeof UpdateEffectivenessSchema>>['formErrors']['fieldErrors']
};

export async function updateActionEffectiveness(
  prevState: EffectivenessFormState | null,
  formData: FormData
): Promise<EffectivenessFormState> {
  const validatedFields = UpdateEffectivenessSchema.safeParse({
    campaignId: formData.get('campaignId'),
    actionId: formData.get('actionId'),
    plannedAverageCheck: formData.get('plannedAverageCheck'),
    actualAverageCheck: formData.get('actualAverageCheck'),
    plannedMarginality: formData.get('plannedMarginality'),
    actualMarginality: formData.get('actualMarginality'),
  });

  if (!validatedFields.success) {
    const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors).flat().join("\n");
    return {
      message: `Ошибка валидации: ${errorMessages}`,
      error: true,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { campaignId, actionId, plannedAverageCheck, actualAverageCheck, plannedMarginality, actualMarginality } = validatedFields.data;

  try {
    await updateActionEffectivenessData(
        campaignId, 
        actionId, 
        {
            plannedAverageCheck: Number(plannedAverageCheck) || 0, 
            actualAverageCheck: Number(actualAverageCheck) || 0,
            plannedMarginality: Number(plannedMarginality) || 0,
            actualMarginality: Number(actualMarginality) || 0,
        }
    );
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
    return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
  }

  revalidatePath(`/campaigns/${campaignId}/${actionId}`);
  return { message: "Данные эффективности обновлены." };
}

const UpdateActionStatusSchema = z.object({
  campaignId: z.string(),
  actionId: z.string(),
  status: z.enum(['planned', 'in-progress', 'completed']),
});

export type StatusFormState = {
  message: string;
  error?: boolean;
};

export async function updateActionStatus(
  prevState: StatusFormState,
  formData: FormData
): Promise<StatusFormState> {
  const validatedFields = UpdateActionStatusSchema.safeParse({
    campaignId: formData.get('campaignId'),
    actionId: formData.get('actionId'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      message: "Ошибка валидации.",
      error: true,
    };
  }

  const { campaignId, actionId, status } = validatedFields.data;

  try {
    await updateActionStatusData(campaignId, actionId, status);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
    return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
  }

  revalidatePath(`/campaigns/${campaignId}/${actionId}`);
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath(`/actions`);
  return { message: "Статус акции обновлен." };
}

const UpdateCampaignStatusSchema = z.object({
  campaignId: z.string(),
  status: z.enum(['active', 'planned', 'completed', 'paused', 'archived']),
});

export type CampaignStatusFormState = {
  message: string;
  error?: boolean;
};

export async function updateCampaignStatus(
  prevState: CampaignStatusFormState,
  formData: FormData
): Promise<CampaignStatusFormState> {
  const validatedFields = UpdateCampaignStatusSchema.safeParse({
    campaignId: formData.get('campaignId'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      message: "Ошибка валидации.",
      error: true,
    };
  }

  const { campaignId, status } = validatedFields.data;

  try {
    await updateCampaignStatusData(campaignId, status as CampaignStatus);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
    return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
  }

  revalidatePath(`/campaigns`);
  revalidatePath(`/campaigns/${campaignId}`);
  return { message: "Статус кампании обновлен." };
}

const CampaignSchema = z.object({
  name: z.string().min(3, { message: "Название кампании должно содержать не менее 3 символов." }),
  description: z.string().min(10, { message: "Описание должно содержать не менее 10 символов." }),
  budget: z.coerce.number().min(0, { message: "Бюджет не может быть отрицательным." }),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Неверный формат даты начала." }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Неверный формат даты окончания." }),
});

export type CampaignFormState = {
  message: string;
  error?: boolean;
  errors?: z.ZodError<z.infer<typeof CampaignSchema>>['formErrors']['fieldErrors'];
  fields?: Record<string, any>;
}

export async function createCampaign(formData: FormData): Promise<CampaignFormState> {
    if (!formData) {
        return { message: "Не предоставлены данные формы.", error: true };
    }
    
    const rawFormData = {
        name: formData.get('name'),
        description: formData.get('description'),
        budget: formData.get('budget'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
    };
    
    const validatedFields = CampaignSchema.safeParse(rawFormData);

    if (!validatedFields.success) {
        return {
            message: "Ошибка валидации.",
            error: true,
            errors: validatedFields.error.flatten().fieldErrors,
            fields: rawFormData,
        };
    }

    try {
        await createCampaignData(validatedFields.data);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { 
            message: `Ошибка базы данных: ${errorMessage}`, 
            error: true,
            fields: rawFormData,
        };
    }

    revalidatePath('/campaigns');
    return { message: "Кампания успешно создана." };
}

export async function editCampaign(prevState: CampaignFormState, formData: FormData): Promise<CampaignFormState> {
    const campaignId = formData.get('campaignId') as string;
    if (!campaignId) {
        return { message: "ID кампании отсутствует.", error: true };
    }
    
    const rawFormData = {
        name: formData.get('name'),
        description: formData.get('description'),
        budget: formData.get('budget'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
    };

    const validatedFields = CampaignSchema.safeParse(rawFormData);

    if (!validatedFields.success) {
        const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors).flat().join("\n");
        return {
            message: `Ошибка валидации: ${errorMessages}`,
            error: true,
            errors: validatedFields.error.flatten().fieldErrors,
            fields: rawFormData,
        };
    }

    try {
        await updateCampaignData(campaignId, validatedFields.data);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { 
            message: `Ошибка базы данных: ${errorMessage}`, 
            error: true,
            fields: rawFormData,
        };
    }

    revalidatePath('/campaigns');
    revalidatePath(`/campaigns/${campaignId}`);
    return { message: "Кампания успешно обновлена." };
}

export async function deleteCampaign(formData: FormData): Promise<DeleteFormState> {
    const campaignId = formData.get('campaignId') as string;
    if (!campaignId) {
        return { message: "ID кампании отсутствует.", error: true };
    }

    try {
        await deleteCampaignData(campaignId);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
    }
    
    revalidatePath('/campaigns');
    revalidatePath('/database');
    return { message: "Кампания успешно удалена." };
}

export async function clearDatabase(): Promise<DeleteFormState> {
    try {
        await clearDatabaseData();
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
    }
    
    revalidatePath('/database');
    revalidatePath('/campaigns');
    revalidatePath('/actions');
    revalidatePath('/activities');
    revalidatePath('/smm');
    revalidatePath('/tasks');
    return { message: "База данных успешно очищена." };
}

// --- KPI Metric Log Actions ---
const EditKpiMetricSchema = z.object({
  campaignId: z.string(),
  actionId: z.string(),
  activityId: z.string(),
  kpiId: z.string(),
  logId: z.string(),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Неверный формат даты."),
  value: z.coerce.number().min(0, "Значение не может быть отрицательным."),
});

export type KpiMetricFormState = {
  message: string;
  error?: boolean;
  errors?: z.ZodError<z.infer<typeof EditKpiMetricSchema>>['formErrors']['fieldErrors'];
};

export async function editKpiMetric(prevState: KpiMetricFormState, formData: FormData): Promise<KpiMetricFormState> {
    const validatedFields = EditKpiMetricSchema.safeParse({
        campaignId: formData.get('campaignId'),
        actionId: formData.get('actionId'),
        activityId: formData.get('activityId'),
        kpiId: formData.get('kpiId'),
        logId: formData.get('logId'),
        date: formData.get('date'),
        value: formData.get('value'),
    });

    if (!validatedFields.success) {
        const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors).flat().join("\n");
        return {
            message: `Ошибка валидации: ${errorMessages}`,
            error: true,
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { campaignId, actionId, activityId, kpiId, logId, date, value } = validatedFields.data;
    
    try {
        await editKpiMetricData(campaignId, actionId, activityId, kpiId, { id: logId, date, value });
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
    }

    revalidatePath(`/campaigns/${campaignId}/${actionId}`);
    return { message: "Запись KPI успешно обновлена." };
}

export async function deleteKpiMetric(prevState: DeleteFormState, formData: FormData): Promise<DeleteFormState> {
    const campaignId = formData.get('campaignId') as string;
    const actionId = formData.get('actionId') as string;
    const activityId = formData.get('activityId') as string;
    const kpiId = formData.get('kpiId') as string;
    const logId = formData.get('logId') as string;

    if (!campaignId || !actionId || !activityId || !kpiId || !logId) {
        return { message: "Отсутствуют необходимые идентификаторы.", error: true };
    }

    try {
        await deleteKpiMetricData(campaignId, actionId, activityId, kpiId, logId);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
    }

    revalidatePath(`/campaigns/${campaignId}/${actionId}`);
    return { message: "Запись KPI успешно удалена." };
}


// --- AI Analyzer Action ---
export type AnalyzeActionState = 
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; analysis: AnalyzeActionPerformanceOutput }
    | { status: 'error'; error: string };

export async function analyzeAction(action: Action, campaign: Campaign, socialPosts: AiSocialPost[]): Promise<AnalyzeActionState> {
    const actionContext = {
        campaignName: campaign.name,
        campaignBudget: campaign.budget,
        campaignStartDate: campaign.startDate,
        campaignEndDate: campaign.endDate,
        ...action,
        socialPosts: socialPosts,
    };

    try {
        const analysis = await analyzeActionPerformance({
            actionContext: JSON.stringify(actionContext, null, 2),
        });
        return { status: 'success', analysis };
    } catch(e) {
        console.error("AI Analysis failed:", e);
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка при анализе.";
        return { status: 'error', error: errorMessage };
    }
}

// --- Responsibility Actions ---
const ResponsibilitySchema = z.object({
  campaignId: z.string(),
  actionId: z.string(),
  responsiblePerson: z.string().optional(),
  marketingHead: z.string().optional(),
  financeHead: z.string().optional(),
  itHead: z.string().optional(),
  curator: z.string().optional(),
  salesHead: z.string().optional(),
});

export async function updateActionResponsibility(prevState: ResponsibilityFormState, formData: FormData): Promise<ResponsibilityFormState> {
  const validatedFields = ResponsibilitySchema.safeParse({
    campaignId: formData.get('campaignId'),
    actionId: formData.get('actionId'),
    responsiblePerson: formData.get('responsiblePerson'),
    marketingHead: formData.get('marketingHead'),
    financeHead: formData.get('financeHead'),
    itHead: formData.get('itHead'),
    curator: formData.get('curator'),
    salesHead: formData.get('salesHead'),
  });

  if (!validatedFields.success) {
    const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors).flat().join("\n");
    return {
      message: `Ошибка валидации: ${errorMessages}`,
      error: true,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { campaignId, actionId, ...responsibilityData } = validatedFields.data;

  try {
    await updateActionResponsibilityData(campaignId, actionId, responsibilityData);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
    return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
  }

  revalidatePath(`/campaigns/${campaignId}/${actionId}`);
  return { message: "Ответственные лица обновлены." };
}


const ConditionsSchema = z.object({
    campaignId: z.string(),
    actionId: z.string(),
    conditions: z.string().optional(),
});

export type ConditionsFormState = {
  message: string;
  error?: boolean;
  errors?: z.ZodError<z.infer<typeof ConditionsSchema>>['formErrors']['fieldErrors']
};

export async function updateActionConditions(prevState: ConditionsFormState, formData: FormData): Promise<ConditionsFormState> {
    const validatedFields = ConditionsSchema.safeParse({
        campaignId: formData.get('campaignId'),
        actionId: formData.get('actionId'),
        conditions: formData.get('conditions'),
    });

    if (!validatedFields.success) {
        const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors).flat().join("\n");
        return {
            message: `Ошибка валидации: ${errorMessages}`,
            error: true,
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { campaignId, actionId, conditions } = validatedFields.data;

    try {
        await updateActionConditionsData(campaignId, actionId, conditions || '');
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
    }

    revalidatePath(`/campaigns/${campaignId}/${actionId}`);
    return { message: "Условия акции успешно обновлены." };
}

// --- Resource Actions ---

const ResourceSchema = z.object({
  name: z.string().min(1, "Название обязательно."),
  status: z.enum(['draft', 'planned', 'in-progress', 'ready']),
  responsiblePerson: z.string().optional(),
  plannedDate: z.string().optional(),
  linkedExpenseId: z.string().optional(),
});

export type ResourceFormState = {
  message: string;
  error?: boolean;
  errors?: z.ZodError<z.infer<typeof ResourceSchema>>['formErrors']['fieldErrors']
}

export async function addResourceToAction(prevState: ResourceFormState, formData: FormData): Promise<ResourceFormState> {
  const campaignId = formData.get('campaignId') as string;
  const actionId = formData.get('actionId') as string;

  const rawData = {
    name: formData.get('name'),
    status: formData.get('status'),
    responsiblePerson: formData.get('responsiblePerson'),
    plannedDate: formData.get('plannedDate'),
    linkedExpenseId: formData.get('linkedExpenseId') === 'none' ? '' : formData.get('linkedExpenseId'),
  };

  const validatedFields = ResourceSchema.safeParse(rawData);

  if (!validatedFields.success) {
    const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors).flat().join("\n");
    return {
      message: `Ошибка валидации: ${errorMessages}`,
      error: true,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const dataToSave = {
      ...validatedFields.data,
      responsiblePerson: validatedFields.data.responsiblePerson || '',
      plannedDate: validatedFields.data.plannedDate || '',
      linkedExpenseId: validatedFields.data.linkedExpenseId || '',
  }

  try {
    await addResourceToActionData(campaignId, actionId, dataToSave as Omit<Resource, 'id'>);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
    return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
  }

  revalidatePath(`/campaigns/${campaignId}/${actionId}`);
  return { message: "Ресурс успешно добавлен." };
}

export async function updateResourceInAction(prevState: ResourceFormState, formData: FormData): Promise<ResourceFormState> {
  const campaignId = formData.get('campaignId') as string;
  const actionId = formData.get('actionId') as string;
  const resourceId = formData.get('resourceId') as string;

  const rawData = {
    name: formData.get('name'),
    status: formData.get('status'),
    responsiblePerson: formData.get('responsiblePerson'),
    plannedDate: formData.get('plannedDate'),
    linkedExpenseId: formData.get('linkedExpenseId') === 'none' ? '' : formData.get('linkedExpenseId'),
  };

  const validatedFields = ResourceSchema.safeParse(rawData);


  if (!validatedFields.success) {
    const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors).flat().join("\n");
    return {
      message: `Ошибка валидации: ${errorMessages}`,
      error: true,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const dataToSave = {
      ...validatedFields.data,
      responsiblePerson: validatedFields.data.responsiblePerson || '',
      plannedDate: validatedFields.data.plannedDate || '',
      linkedExpenseId: validatedFields.data.linkedExpenseId || '',
  };

  try {
    await updateResourceInActionData(campaignId, actionId, { id: resourceId, ...dataToSave } as Resource);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
    return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
  }

  revalidatePath(`/campaigns/${campaignId}/${actionId}`);
  return { message: "Ресурс успешно обновлен." };
}

export async function deleteResource(prevState: DeleteFormState, formData: FormData): Promise<DeleteFormState> {
    const campaignId = formData.get('campaignId') as string;
    const actionId = formData.get('actionId') as string;
    const resourceId = formData.get('resourceId') as string;

    if (!campaignId || !actionId || !resourceId) {
        return { message: "Отсутствуют необходимые идентификаторы.", error: true };
    }
    
    try {
        await deleteResourceFromAction(campaignId, actionId, resourceId);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
    }

    revalidatePath(`/campaigns/${campaignId}/${actionId}`);
    return { message: "Ресурс успешно удален." };
}

const UpdateResourceStatusSchema = z.object({
  campaignId: z.string(),
  actionId: z.string(),
  resourceId: z.string(),
  status: z.enum(['draft', 'planned', 'in-progress', 'ready']),
});


export async function updateResourceStatus(prevState: ResourceStatusFormState, formData: FormData): Promise<ResourceStatusFormState> {
  const validatedFields = UpdateResourceStatusSchema.safeParse({
    campaignId: formData.get('campaignId'),
    actionId: formData.get('actionId'),
    resourceId: formData.get('resourceId'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      message: "Ошибка валидации.",
      error: true,
    };
  }

  const { campaignId, actionId, resourceId, status } = validatedFields.data;

  try {
    await updateResourceStatusData(campaignId, actionId, resourceId, status as ResourceStatus);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
    return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
  }

  revalidatePath(`/campaigns/${campaignId}/${actionId}`);
  return { message: "Статус ресурса обновлен." };
}


// --- Expense Status Action ---
const UpdateExpenseStatusSchema = z.object({
  campaignId: z.string(),
  actionId: z.string(),
  expenseId: z.string(),
  activityId: z.string(), // Can be 'general' or an activity ID
  status: z.enum(['planned', 'invoice-received', 'pending-payment', 'paid']),
});

export async function updateExpenseStatus(prevState: ExpenseStatusFormState, formData: FormData): Promise<ExpenseStatusFormState> {
  const validatedFields = UpdateExpenseStatusSchema.safeParse({
    campaignId: formData.get('campaignId'),
    actionId: formData.get('actionId'),
    expenseId: formData.get('expenseId'),
    activityId: formData.get('activityId'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return { message: "Ошибка валидации: неверные данные.", error: true };
  }

  const { campaignId, actionId, expenseId, activityId, status } = validatedFields.data;

  try {
    await updateExpenseStatusData(campaignId, actionId, expenseId, activityId, status);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
    return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
  }

  revalidatePath(`/campaigns/${campaignId}/${actionId}`);
  return { message: "Статус расхода обновлен." };
}


// --- Social Post Actions ---
const SocialPostSchema = z.object({
  title: z.string().min(1, "Заголовок обязателен."),
  platforms: z.array(z.string()).min(1, "Выберите хотя бы одну платформу").optional(),
  text: z.string(),
  plannedReach: z.coerce.number().min(0).optional().nullable(),
  plannedComments: z.coerce.number().min(0).optional().nullable(),
  publicationDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Неверный формат даты.").optional().nullable(),
  status: z.enum(['draft', 'ready', 'published']).optional().nullable(),
  campaignId: z.string().optional().nullable(),
  actionId: z.string().optional().nullable(),
  activityId: z.string().optional().nullable(),
});

export type SocialPostFormState = {
  message: string;
  error?: boolean;
  errors?: z.ZodError['formErrors']['fieldErrors'];
};

export async function addSocialPost(prevState: SocialPostFormState, formData: FormData): Promise<SocialPostFormState> {
    const rawActionId = formData.get('actionId');
    const rawCampaignId = formData.get('campaignId');

    const data = {
        title: formData.get('title'),
        platforms: formData.getAll('platforms'),
        text: formData.get('text'),
        plannedReach: formData.get('plannedReach') || '0',
        plannedComments: formData.get('plannedComments') || '0',
        publicationDate: formData.get('publicationDate') || new Date().toISOString().split('T')[0],
        status: formData.get('status'),
        campaignId: rawCampaignId === 'none' ? undefined : rawCampaignId,
        actionId: rawActionId === 'none' ? undefined : rawActionId,
    };
    
    const postToSave: Omit<SocialPost, 'id'> = {
        title: (data.title as string) || '',
        platforms: (data.platforms as SocialPlatform[]) || [],
        text: (data.text as string) || '',
        plannedReach: Number(data.plannedReach),
        actualReach: 0,
        plannedComments: Number(data.plannedComments),
        actualComments: 0,
        publicationDate: data.publicationDate,
        status: (data.status as SocialPostStatus) || 'draft',
    };
    if (data.campaignId) postToSave.campaignId = data.campaignId as string;
    if (data.actionId) postToSave.actionId = data.actionId as string;
    
    try {
        await addDoc(collection(db, "socialPosts"), postToSave);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
    }

    revalidatePath(`/smm`);
    if (postToSave.campaignId && postToSave.actionId) {
        revalidatePath(`/campaigns/${postToSave.campaignId}/${postToSave.actionId}`);
    }
    return { message: "Пост успешно добавлен." };
}

const UpdateSocialPostSchema = SocialPostSchema.extend({
    postId: z.string(),
    actualReach: z.coerce.number().min(0).optional(),
    actualComments: z.coerce.number().min(0).optional(),
});


export async function updateSocialPost(prevState: SocialPostFormState, formData: FormData): Promise<SocialPostFormState> {
    const rawActionId = formData.get('actionId');
    const rawCampaignId = formData.get('campaignId');
    const rawActivityId = formData.get('activityId');

    const validatedFields = UpdateSocialPostSchema.safeParse({
        postId: formData.get('postId'),
        campaignId: rawCampaignId === 'none' ? undefined : rawCampaignId,
        actionId: rawActionId === 'none' ? undefined : rawActionId,
        activityId: rawActivityId === 'general' || rawActivityId === 'none' ? undefined : rawActivityId,
        title: formData.get('title'),
        platforms: formData.getAll('platforms'),
        text: formData.get('text'), 
        plannedReach: formData.get('plannedReach'),
        plannedComments: formData.get('plannedComments'),
        actualReach: formData.get('actualReach'),
        actualComments: formData.get('actualComments'),
        publicationDate: formData.get('publicationDate'),
        status: formData.get('status'),
    });

    if (!validatedFields.success) {
        const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors).flat().join("\n");
        return {
            message: `Ошибка валидации: ${errorMessages}`,
            error: true,
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    const { postId, ...postData } = validatedFields.data;
    
    try {
        const postRef = doc(db, "socialPosts", postId);
        
        const updateData: { [key: string]: any } = {
            title: postData.title || '',
            platforms: (postData.platforms as SocialPlatform[]) || [],
            text: postData.text || '',
            plannedReach: postData.plannedReach || 0,
            actualReach: postData.actualReach || 0,
            plannedComments: postData.plannedComments || 0,
            actualComments: postData.actualComments || 0,
            publicationDate: postData.publicationDate || new Date().toISOString().split('T')[0],
            status: postData.status || 'draft',
            campaignId: postData.campaignId,
            actionId: postData.actionId,
            activityId: postData.activityId,
        };
        
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                updateData[key] = deleteField();
            }
        });

        await updateDoc(postRef, updateData);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
    }
    
    revalidatePath(`/smm`);
    if (postData.campaignId && postData.actionId) {
      revalidatePath(`/campaigns/${postData.campaignId}/${postData.actionId}`);
    } else if (postData.campaignId) {
        revalidatePath(`/campaigns/${postData.campaignId}`);
    }
    return { message: "Пост успешно обновлен." };
}

export async function deleteSocialPost(formData: FormData): Promise<DeleteFormState> {
    const postId = formData.get('postId') as string;
    
    if (!postId) {
        return { message: "Отсутствует ID поста.", error: true };
    }

    try {
        await deleteSocialPostData(postId);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
    }

    revalidatePath('/smm');
    revalidatePath('/campaigns'); // Revalidate all campaign pages just in case
    revalidatePath('/database');
    return { message: "Пост успешно удален." };
}

const UpdateSocialPostMetricsSchema = z.object({
    postId: z.string(),
    actualReach: z.coerce.number().min(0, 'Значение должно быть положительным').optional(),
    actualComments: z.coerce.number().min(0, 'Значение должно быть положительным').optional(),
});


export type SocialPostMetricsFormState = {
  message: string;
  error?: boolean;
  errors?: {
    actualReach?: string[];
    actualComments?: string[];
  }
}

export async function updateSocialPostMetrics(prevState: SocialPostMetricsFormState, formData: FormData): Promise<SocialPostMetricsFormState> {
    const validatedFields = UpdateSocialPostMetricsSchema.safeParse({
        postId: formData.get('postId'),
        actualReach: formData.get('actualReach') || undefined,
        actualComments: formData.get('actualComments') || undefined,
    });
    
    if (!validatedFields.success) {
        const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors).flat().join("\n");
        return {
            message: `Ошибка валидации: ${errorMessages}`,
            error: true,
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { postId, ...metrics } = validatedFields.data;
    
    try {
        const postRef = doc(db, "socialPosts", postId);
        
        const dataToUpdate: Partial<SocialPost> = {};

        if (metrics.actualReach !== undefined) {
            dataToUpdate.actualReach = metrics.actualReach;
        }
        if (metrics.actualComments !== undefined) {
            dataToUpdate.actualComments = metrics.actualComments;
        }

        if (Object.keys(dataToUpdate).length > 0) {
            await updateDoc(postRef, dataToUpdate);
        } else {
            return { message: "Нет данных для обновления." };
        }
        
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
    }

    const post = await getSocialPostById(postId);
    if(post?.campaignId && post?.actionId) {
        revalidatePath(`/campaigns/${post.campaignId}/${post.actionId}`);
    }
    revalidatePath('/smm');
    return { message: "Фактические показатели обновлены." };
}

// --- AI Post Generation Action ---
const GeneratePostTextSchema = z.object({
  topic: z.string().min(3, "Тема должна содержать не менее 3 символов."),
  productName: z.string(),
  targetAudience: z.string(),
  tone: z.string(),
});

type GeneratePostState = {
    message: string,
    postText?: string,
}
export async function generatePostTextAction(input: GeneratePostTextInput): Promise<GeneratePostState> {
    const parsed = GeneratePostTextSchema.safeParse(input);

    if (!parsed.success) {
        return { message: parsed.error.issues.map(i => i.message).join(', ') };
    }

    try {
        const result = await generatePostText(parsed.data);
        if (result && result.postText) {
            return { message: 'Текст успешно создан', postText: result.postText };
        }
        return { message: 'Не удалось сгенерировать текст.' };
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Неизвестная ошибка ИИ.";
        return { message: `Ошибка генерации: ${errorMessage}` };
    }
}

const DeleteActionSchema = z.object({
  campaignId: z.string(),
  actionId: z.string(),
});

export async function deleteAction(
  prevState: DeleteFormState,
  formData: FormData
): Promise<DeleteFormState> {
  const validatedFields = DeleteActionSchema.safeParse({
    campaignId: formData.get("campaignId"),
    actionId: formData.get("actionId"),
  });

  if (!validatedFields.success) {
    return {
      message: "Отсутствуют необходимые ID.",
      error: true,
    };
  }

  const { campaignId, actionId } = validatedFields.data;

  try {
    await deleteActionData(campaignId, actionId);
    revalidatePath(`/campaigns/${campaignId}`);
    revalidatePath('/actions');
    return { message: "Акция успешно удалена." };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
    return {
      message: `Не удалось удалить акцию: ${errorMessage}`,
      error: true,
    };
  }
}

// --- Database Import/Export ---
type ExportState = {
    error?: string;
    buffer?: number[];
}

export async function exportDatabase(): Promise<ExportState> {
    try {
        const campaigns = await getCampaigns();
        const posts = await getAllSocialPosts();
        const tasks = await getAllTasks();

        const wb = XLSX.utils.book_new();

        // Flatten data
        const flatCampaigns: any[] = [];
        const flatActions: any[] = [];
        const flatActivities: any[] = [];
        const flatKpis: any[] = [];
        const flatExpenses: any[] = [];
        const flatResources: any[] = [];
        
        campaigns.forEach(c => {
            const { actions, ...campaignRest } = c;
            flatCampaigns.push(campaignRest);

            (actions || []).forEach(a => {
                const { activities, generalExpenses, resources, ...actionRest } = a;
                flatActions.push({ ...actionRest, campaignId: c.id });

                (activities || []).forEach(act => {
                    const { kpis, expenses, ...activityRest } = act;
                    flatActivities.push({ ...activityRest, actionId: a.id, campaignId: c.id });

                    (kpis || []).forEach(kpi => {
                        const { metrics, ...kpiRest } = kpi;
                        flatKpis.push({ ...kpiRest, activityId: act.id, metricsJson: JSON.stringify(metrics) });
                    });

                    (expenses || []).forEach(exp => {
                        flatExpenses.push({ ...exp, parentId: act.id, parentType: 'activity' });
                    });
                });
                
                (generalExpenses || []).forEach(exp => {
                    flatExpenses.push({ ...exp, parentId: a.id, parentType: 'action' });
                });

                 (resources || []).forEach(res => {
                    flatResources.push({ ...res, actionId: a.id });
                });
            });
        });

        const wsCampaigns = XLSX.utils.json_to_sheet(flatCampaigns);
        const wsActions = XLSX.utils.json_to_sheet(flatActions);
        const wsActivities = XLSX.utils.json_to_sheet(flatActivities);
        const wsKpis = XLSX.utils.json_to_sheet(flatKpis);
        const wsExpenses = XLSX.utils.json_to_sheet(flatExpenses);
        const wsResources = XLSX.utils.json_to_sheet(flatResources);
        const wsPosts = XLSX.utils.json_to_sheet(posts);
        const wsTasks = XLSX.utils.json_to_sheet(tasks);


        XLSX.utils.book_append_sheet(wb, wsCampaigns, "Campaigns");
        XLSX.utils.book_append_sheet(wb, wsActions, "Actions");
        XLSX.utils.book_append_sheet(wb, wsActivities, "Activities");
        XLSX.utils.book_append_sheet(wb, wsKpis, "KPIs");
        XLSX.utils.book_append_sheet(wb, wsExpenses, "Expenses");
        XLSX.utils.book_append_sheet(wb, wsResources, "Resources");
        XLSX.utils.book_append_sheet(wb, wsPosts, "SocialPosts");
        XLSX.utils.book_append_sheet(wb, wsTasks, "Tasks");

        const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

        return { buffer: Array.from(buffer) };

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { error: `Не удалось экспортировать базу данных: ${errorMessage}` };
    }
}

type ImportState = {
    message: string;
    error?: boolean;
}

export async function importDatabase(data: Uint8Array): Promise<ImportState> {
    try {
        const workbook = XLSX.read(data, { type: 'array' });
        
        const campaigns = XLSX.utils.sheet_to_json<any>(workbook.Sheets['Campaigns'] || {});
        const actions = XLSX.utils.sheet_to_json<any>(workbook.Sheets['Actions'] || {});
        const activities = XLSX.utils.sheet_to_json<any>(workbook.Sheets['Activities'] || {});
        const kpis = XLSX.utils.sheet_to_json<any>(workbook.Sheets['KPIs'] || {});
        const expenses = XLSX.utils.sheet_to_json<any>(workbook.Sheets['Expenses'] || {});
        const resources = XLSX.utils.sheet_to_json<any>(workbook.Sheets['Resources'] || {});
        const socialPosts = XLSX.utils.sheet_to_json<SocialPost>(workbook.Sheets['SocialPosts'] || {});
        const tasks = XLSX.utils.sheet_to_json<Task>(workbook.Sheets['Tasks'] || []);
        
        // Reconstruct the nested structure
        const reconstructedCampaigns = campaigns.map(c => {
            const campaignActions = actions.filter(a => a.campaignId === c.id).map(a => {
                const actionActivities = activities.filter(act => act.actionId === a.id).map(act => {
                    const activityKpis = kpis.filter(k => k.activityId === act.id).map(k => {
                        return { ...k, metrics: JSON.parse(k.metricsJson || '[]') };
                    });
                    const activityExpenses = expenses.filter(e => e.parentId === act.id && e.parentType === 'activity');
                    return { ...act, kpis: activityKpis, expenses: activityExpenses };
                });
                const actionExpenses = expenses.filter(e => e.parentId === a.id && e.parentType === 'action');
                const actionResources = resources.filter(r => r.actionId === a.id);
                return { ...a, activities: actionActivities, generalExpenses: actionExpenses, resources: actionResources };
            });
            return { ...c, actions: campaignActions };
        });
        
        await restoreDatabase(reconstructedCampaigns, socialPosts, tasks);

        revalidatePath('/'); // Revalidate all paths
        return { message: "База данных успешно импортирована." };
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка импорта: ${errorMessage}`, error: true };
    }
}


// --- Task Actions ---
const TaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['planned', 'in-progress', 'completed']),
  deadline: z.string().optional(),
  responsiblePerson: z.string().optional(),
  campaignId: z.string().optional(),
  actionId: z.string().optional(),
  activityId: z.string().optional(),
});

export async function addTask(prevState: TaskFormState, formData: FormData): Promise<TaskFormState> {
  const validatedFields = TaskSchema.safeParse({
    title: formData.get('title') || '',
    description: formData.get('description') || '',
    status: formData.get('status'),
    deadline: formData.get('deadline') || new Date().toISOString().split('T')[0],
    responsiblePerson: formData.get('responsiblePerson') || '',
    campaignId: formData.get('campaignId') === 'none' ? undefined : formData.get('campaignId'),
    actionId: formData.get('actionId') === 'none' ? undefined : formData.get('actionId'),
    activityId: formData.get('activityId') === 'none' ? undefined : formData.get('activityId'),
  });

  if (!validatedFields.success) {
    return {
      message: "Ошибка валидации. Не удалось создать задачу.",
      errors: validatedFields.error.flatten().fieldErrors,
      error: true,
    };
  }

  try {
    await addTaskData(validatedFields.data as Omit<Task, 'id' | 'createdAt' | 'isArchived'>);
    revalidatePath('/tasks');
    revalidatePath('/');
    return { message: "Задача успешно создана." };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
    return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
  }
}

export async function updateTask(prevState: TaskFormState, formData: FormData): Promise<TaskFormState> {
  const taskId = formData.get('taskId') as string;
  if (!taskId) {
    return { message: "ID задачи отсутствует.", error: true };
  }

  const validatedFields = TaskSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    status: formData.get('status'),
    deadline: formData.get('deadline'),
    responsiblePerson: formData.get('responsiblePerson'),
    campaignId: formData.get('campaignId') === 'none' ? undefined : formData.get('campaignId'),
    actionId: formData.get('actionId') === 'none' ? undefined : formData.get('actionId'),
    activityId: formData.get('activityId') === 'none' ? undefined : formData.get('activityId'),
  });

  if (!validatedFields.success) {
    return {
      message: "Ошибка валидации. Не удалось обновить задачу.",
      errors: validatedFields.error.flatten().fieldErrors,
      error: true,
    };
  }
  
  try {
    await updateTaskData(taskId, validatedFields.data);
    revalidatePath('/tasks');
    revalidatePath('/');
    return { message: "Задача успешно обновлена." };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
    return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
  }
}

export async function deleteTask(formData: FormData): Promise<DeleteFormState> {
    const taskId = formData.get('taskId') as string;
    if (!taskId) {
        return { message: "ID задачи отсутствует.", error: true };
    }
    try {
        await deleteTaskData(taskId);
        revalidatePath('/tasks');
        revalidatePath('/');
        return { message: "Задача успешно удалена." };
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
    }
}

export async function archiveTask(formData: FormData): Promise<DeleteFormState> {
    const taskId = formData.get('taskId') as string;
    if (!taskId) {
        return { message: "ID задачи отсутствует.", error: true };
    }
    try {
        await updateTaskData(taskId, { isArchived: true });
        revalidatePath('/tasks');
        return { message: "Задача успешно архивирована." };
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
    }
}
export async function restoreTask(formData: FormData): Promise<DeleteFormState> {
    const taskId = formData.get('taskId') as string;
    if (!taskId) {
        return { message: "ID задачи отсутствует.", error: true };
    }
    try {
        await updateTaskData(taskId, { isArchived: false });
        revalidatePath('/tasks');
        return { message: "Задача успешно восстановлена." };
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
    }
}
