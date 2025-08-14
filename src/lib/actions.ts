

"use server";

import { z } from "zod";
import { addAction, updateAction, addActivity, updateActivity as updateActivityData, deleteActivity as deleteActivityData, updateActivityMetrics as updateActivityMetricsData, addExpenseToActivity as addExpenseToActivityData, updateExpense as updateExpenseData, deleteExpenseFromActivity, addGeneralExpenseToAction, updateGeneralExpenseInAction, deleteGeneralExpenseFromAction, updateActionSummaryKpis as updateActionSummaryKpisData, updateActionEffectiveness as updateActionEffectivenessData, updateActionStatus as updateActionStatusData, updateCampaignStatus as updateCampaignStatusData, updateCampaign as updateCampaignData, deleteCampaign as deleteCampaignData } from "./data";
import { revalidatePath } from "next/cache";
import type { Action, Activity, KPI, Expense, ActionStatus, CampaignStatus } from "./types";
import { redirect } from "next/navigation";

const ActionSchema = z.object({
  name: z.string().min(3, { message: "Название акции должно содержать не менее 3 символов." }),
  description: z.string().optional(),
  targetAudience: z.string().optional(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Неверный формат даты начала." }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Неверный формат даты окончания." }),
  status: z.enum(['planned', 'in-progress', 'completed']),
  campaignId: z.string(),
});

const AddActionSchema = ActionSchema;

const EditActionSchema = ActionSchema.extend({
  id: z.string(),
});

export type ActionFormState = {
  message: string;
  errors?: {
    name?: string[];
    description?: string[];
    targetAudience?: string[];
    startDate?: string[];
    endDate?: string[];
    status?: string[];
    campaignId?: string[];
    id?: string[];
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
    startDate: formData.get('start-date'),
    endDate: formData.get('end-date'),
    status: formData.get('status'),
    campaignId: formData.get('campaignId'),
  });

  if (!validatedFields.success) {
    return {
      message: "Ошибка валидации. Не удалось создать акцию.",
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
  return { message: "Акция успешно добавлена." };
}

export async function editActionInCampaign(
  prevState: ActionFormState | null,
  formData: FormData
): Promise<ActionFormState> {
  
  const validatedFields = EditActionSchema.safeParse({
    id: formData.get('actionId'),
    name: formData.get('action-name'),
    description: formData.get('description'),
    targetAudience: formData.get('target-audience'),
    startDate: formData.get('start-date'),
    endDate: formData.get('end-date'),
    status: formData.get('status'),
    campaignId: formData.get('campaignId'),
  });

  if (!validatedFields.success) {
    return {
      message: "Ошибка валидации. Не удалось обновить акцию.",
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
  return { message: "Акция успешно обновлена." };
}

// --- Activity Actions ---

const KpiSchema = z.object({
    id: z.string(),
    name: z.string(),
    target: z.coerce.number(),
    current: z.coerce.number(),
    parentId: z.string().nullable(),
    includeInActionGoals: z.boolean().optional(),
});

const ActivitySchema = z.object({
  name: z.string().min(3, { message: "Название активности должно содержать не менее 3 символов." }),
  description: z.string().optional(),
  budget: z.coerce.number().min(0, { message: "Бюджет не может быть отрицательным." }),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Неверный формат даты начала." }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Неверный формат даты окончания." }),
  kpis: z.array(KpiSchema),
  campaignId: z.string(),
  actionId: z.string(),
});

const EditActivitySchema = ActivitySchema.extend({
  id: z.string(),
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
  const kpis = kpisString ? JSON.parse(kpisString) : [];

  const validatedFields = ActivitySchema.safeParse({
    name: formData.get('activity-name'),
    description: formData.get('description'),
    budget: formData.get('budget'),
    startDate: formData.get('start-date'),
    endDate: formData.get('end-date'),
    kpis: kpis.map((kpi: any) => ({ ...kpi, target: Number(kpi.target), current: 0 })),
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
      kpis: activityData.kpis.map(kpi => ({...kpi, current: 0, includeInActionGoals: kpi.includeInActionGoals ?? true })) 
  }

  try {
    await addActivity(campaignId, actionId, activityToSave as Omit<Activity, 'id'>);
  } catch (error) {
     const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка.";
    return { message: `Ошибка базы данных: не удалось создать активность. ${errorMessage}`, error: true };
  }

  revalidatePath(`/campaigns/${campaignId}/${actionId}`);
  return { message: "Активность успешно добавлена." };
}


export async function updateActivity(
  prevState: ActivityFormState | null,
  formData: FormData
): Promise<ActivityFormState> {

  const kpisString = formData.get('kpis') as string;
  const kpis = kpisString ? JSON.parse(kpisString) : [];

  const validatedFields = EditActivitySchema.safeParse({
    name: formData.get('activity-name'),
    description: formData.get('description'),
    budget: formData.get('budget'),
    startDate: formData.get('start-date'),
    endDate: formData.get('end-date'),
    kpis: kpis.map((kpi: any) => ({ ...kpi, target: Number(kpi.target), current: Number(kpi.current), includeInActionGoals: kpi.includeInActionGoals ?? true })),
    campaignId: formData.get('campaignId'),
    actionId: formData.get('actionId'),
    id: formData.get('activityId'),
  });

  if (!validatedFields.success) {
    return {
      message: "Ошибка валидации. Не удалось обновить активность.",
      errors: validatedFields.error.flatten().fieldErrors,
      error: true,
    };
  }
  
  const { campaignId, actionId, id, ...activityData } = validatedFields.data;

  try {
    await updateActivityData(campaignId, actionId, { id, ...activityData } as Activity);
  } catch (error) {
     const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка.";
    return { message: `Ошибка базы данных: не удалось обновить активность. ${errorMessage}`, error: true };
  }

  revalidatePath(`/campaigns/${campaignId}/${actionId}`);
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
            if (value) { // only include if value is provided
                kpiUpdates[kpiId] = parseFloat(value as string);
            }
        }
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
        return {
            message: "Ошибка валидации.",
            error: true,
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { campaignId, actionId, activityId, ...expenseData } = validatedFields.data;

    try {
       await addExpenseToActivityData(campaignId, actionId, activityId!, expenseData);
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
        return {
            message: "Ошибка валидации.",
            error: true,
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    const { campaignId, actionId, expenseId, originalActivityId, newActivityId, ...expenseData } = validatedFields.data;
    const expenseToUpdate: Expense = { id: expenseId, ...expenseData };

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
        return {
            message: "Ошибка валидации.",
            error: true,
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { campaignId, actionId, activityId, ...expenseData } = validatedFields.data;

    try {
        if (activityId) {
             // Add to a specific activity
            await addExpenseToActivityData(campaignId, actionId, activityId, expenseData);
        } else {
            // Add as a general expense
            await addGeneralExpenseToAction(campaignId, actionId, expenseData);
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
    return {
      message: "Ошибка валидации.",
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
  prevState: StatusFormState | null,
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
  status: z.enum(['active', 'planned', 'completed', 'paused']),
});

export type CampaignStatusFormState = {
  message: string;
  error?: boolean;
};

export async function updateCampaignStatus(
  prevState: CampaignStatusFormState | null,
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
  errors?: z.ZodError<z.infer<typeof CampaignSchema>>['formErrors']['fieldErrors']
}

export async function editCampaign(prevState: CampaignFormState, formData: FormData): Promise<CampaignFormState> {
    const campaignId = formData.get('campaignId') as string;
    if (!campaignId) {
        return { message: "ID кампании отсутствует.", error: true };
    }

    const validatedFields = CampaignSchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description'),
        budget: formData.get('budget'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
    });

    if (!validatedFields.success) {
        return {
            message: "Ошибка валидации.",
            error: true,
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        await updateCampaignData(campaignId, validatedFields.data);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
        return { message: `Ошибка базы данных: ${errorMessage}`, error: true };
    }

    revalidatePath(`/campaigns`);
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
    
    // Redirect after deletion
    redirect('/campaigns');
}
