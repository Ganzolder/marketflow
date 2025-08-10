"use server";

import { z } from "zod";
import { addAction } from "./data";
import { revalidatePath } from "next/cache";

const AddActionSchema = z.object({
  name: z.string().min(3, { message: "Название акции должно содержать не менее 3 символов." }),
  type: z.string().min(3, { message: "Тип акции должен содержать не менее 3 символов." }),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Неверный формат даты начала." }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Неверный формат даты окончания." }),
  status: z.enum(['planned', 'in-progress', 'completed']),
  campaignId: z.string(),
});

export type AddActionFormState = {
  message: string;
  errors?: {
    name?: string[];
    type?: string[];
    startDate?: string[];
    endDate?: string[];
    status?: string[];
    campaignId?: string[];
  };
};

export async function addActionToCampaign(
  prevState: AddActionFormState,
  formData: FormData
): Promise<AddActionFormState> {
  
  const validatedFields = AddActionSchema.safeParse({
    name: formData.get('action-name'),
    type: formData.get('action-type'),
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
