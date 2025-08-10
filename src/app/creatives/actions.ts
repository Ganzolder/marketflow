"use server";

import { generateAdCopy, type GenerateAdCopyInput } from "@/ai/flows/generate-ad-copy";
import { z } from "zod";

const GenerateAdCopyFormSchema = z.object({
  productName: z.string().min(3, "Product name must be at least 3 characters."),
  targetAudience: z.string().min(3, "Target audience must be at least 3 characters."),
  campaignGoal: z.string().min(3, "Campaign goal must be at least 3 characters."),
  tone: z.string(),
  keywords: z.string().min(3, "Please provide some keywords."),
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
      message: "Invalid form data.",
      fields: formData as Record<string, string>,
      issues,
    };
  }
  
  try {
    const result = await generateAdCopy(parsed.data as GenerateAdCopyInput);
    if (result && result.adCopies) {
      return { message: "Successfully generated ad copy.", adCopies: result.adCopies };
    }
    return { message: "Failed to generate ad copy. The AI returned an empty result." };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    return {
      message: `Failed to generate ad copy: ${errorMessage}`,
    };
  }
}
