
'use server';

/**
 * @fileOverview A flow for analyzing marketing tracking methods for an action.
 * 
 * - analyzeTrackingMethods - A function that analyzes tracking methods and provides recommendations.
 * - AnalyzeTrackingMethodsInput - The input type for the analysis function.
 * - AnalyzeTrackingMethodsOutput - The return type for the analysis function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TrackingMethodAnalysisSchema = z.object({
  method: z.string().describe('The tracking method, e.g., a promo code or "UTM-метки".'),
  usage: z.string().describe('A brief summary of where this method is used (e.g., in which social media posts or activities).'),
  recommendation: z.string().describe('A specific, actionable recommendation for what to do with this tracking method. For example, "Проверьте, что промокод заведен в CRM" or "Убедитесь, что все ссылки в постах содержат корректные метки".'),
});

const AnalyzeTrackingMethodsInputSchema = z.object({
  actionContext: z.string().describe('A JSON string representing the full Action object, including its activities and associated social posts.'),
});
export type AnalyzeTrackingMethodsInput = z.infer<typeof AnalyzeTrackingMethodsInputSchema>;

const AnalyzeTrackingMethodsOutputSchema = z.object({
  analysis: z.array(TrackingMethodAnalysisSchema).describe('An array of analyses for each identified tracking method.'),
});
export type AnalyzeTrackingMethodsOutput = z.infer<typeof AnalyzeTrackingMethodsOutputSchema>;

export async function analyzeTrackingMethods(input: AnalyzeTrackingMethodsInput): Promise<AnalyzeTrackingMethodsOutput> {
  return analyzeTrackingMethodsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTrackingMethodsPrompt',
  input: { schema: AnalyzeTrackingMethodsInputSchema },
  output: { schema: AnalyzeTrackingMethodsOutputSchema },
  prompt: `You are a meticulous marketing operations manager. Your task is to analyze all tracking methods for a given marketing action and provide clear, actionable instructions for each.

Analyze the following marketing action data, which is provided as a JSON object. This data includes the action itself, its activities, and any associated social media posts.

{{{actionContext}}}

**Your Task:**
1.  **Identify all unique tracking methods.** These can be:
    - Promo codes found in the 'promoCodes' field of social media posts.
    - Tracking methods mentioned in the 'trackingMethod' field of each activity.
2.  **For each unique method, create an analysis object with three fields:**
    - **method:** The name of the tracking method (e.g., the promo code itself, or the text from 'trackingMethod' like "UTM-метки").
    - **usage:** Briefly describe where this method is used. For promo codes, list the social platforms. For activity-based methods, name the activity.
    - **recommendation:** Provide a very specific and practical "what to do" instruction for an employee. This should be a concrete step to ensure the tracking works correctly.

**Examples of good recommendations:**
- For a promo code "SUMMER24": "Проверьте, что промокод 'SUMMER24' заведен в CRM-системе и кассовом ПО с правильными условиями акции."
- For a tracking method "UTM-метки": "Убедитесь, что все ссылки, используемые в активности 'Контекстная реклама в Яндекс.Директ', содержат корректно настроенные UTM-метки."
- For a tracking method "Опрос на кассе": "Проинструктируйте кассиров о необходимости задавать вопрос 'Откуда вы узнали о нашей акции?' при каждой покупке."

The entire analysis must be in Russian. Structure your response according to the output schema.`,
});

const analyzeTrackingMethodsFlow = ai.defineFlow(
  {
    name: 'analyzeTrackingMethodsFlow',
    inputSchema: AnalyzeTrackingMethodsInputSchema,
    outputSchema: AnalyzeTrackingMethodsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
