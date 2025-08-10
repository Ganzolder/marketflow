"use server";

import { generateAdCopy, type GenerateAdCopyInput } from "@/ai/flows/generate-ad-copy";
import { z } from "zod";

const GenerateAdCopyFormSchema = z.object({
  productName: z.string().min(3, "Название продукта должно содержать не менее 3 символов."),
  targetAudience: z.string().min(3, "Целевая аудитория должна содержать не менее 3 символов."),
  campaignGoal: z.string().min(3, "Цель кампании должна содержать не менее 3 символов."),
  tone: z.string(),
  keywords: z.string().min(3, "Пожалуйста, укажите несколько ключевых слов."),
  numberOfVariations: z.coerce.number().min(1).max(5),
});

export type FormState = {
  message: string;
  adCopies?: string[];
  fields?: Record<string, string>;
  issues?: string[];
};

export async function submitAdCopyRequest(
  prevState: FormState,
  data: FormData
): Promise<FormState> {
  const formData = Object.fromEntries(data);
  const parsed = GenerateAdCopyFormSchema.safeParse(formData);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message);
    return {
      message: "Неверные данные формы.",
      fields: formData as Record<string, string>,
      issues,
    };
  }
  
  try {
    const result = await generateAdCopy(parsed.data as GenerateAdCopyInput);
    if (result && result.adCopies) {
      return { message: "Рекламный текст успешно создан.", adCopies: result.adCopies };
    }
    return { message: "Не удалось создать рекламный текст. ИИ вернул пустой результат." };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
    return {
      message: `Не удалось создать рекламный текст: ${errorMessage}`,
    };
  }
}
