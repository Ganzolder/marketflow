
"use server";

import { z } from "zod";
import { addAction, updateAction, addActivity } from "./data";
import { revalidatePath } from "next/cache";
import type { Action, Activity } from "./types";

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
  prevState: ActionFormState,
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
  prevState: ActionFormState,
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

const ActivitySchema = z.object({
  name: z.string().min(3, { message: "Название активности должно содержать не менее 3 символов." }),
  description: z.string().optional(),
  budget: z.coerce.number().min(0, { message: "Бюджет не может быть отрицательным." }),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Неверный формат даты начала." }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Неверный формат даты окончания." }),
  campaignId: z.string(),
  actionId: z.string(),
});


export type ActivityFormState = {
  message: string;
  errors?: {
    name?: string[];
    description?: string[];
    budget?: string[];
    startDate?: string[];
    endDate?: string[];
  };
};

export async function addActivityToAction(
  prevState: ActivityFormState,
  formData: FormData
): Promise<ActivityFormState> {

  const validatedFields = ActivitySchema.safeParse({
    name: formData.get('activity-name'),
    description: formData.get('description'),
    budget: formData.get('budget'),
    startDate: formData.get('start-date'),
    endDate: formData.get('end-date'),
    campaignId: formData.get('campaignId'),
    actionId: formData.get('actionId'),
  });

  if (!validatedFields.success) {
    return {
      message: "Ошибка валидации. Не удалось создать активность.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { campaignId, actionId, ...activityData } = validatedFields.data;

  try {
    await addActivity(campaignId, actionId, activityData as Omit<Activity, 'id'>);
  } catch (error) {
     const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка.";
    return { message: `Ошибка базы данных: не удалось создать активность. ${errorMessage}` };
  }

  revalidatePath(`/campaigns/${campaignId}/${actionId}`);
  return { message: "Активность успешно добавлена." };
}