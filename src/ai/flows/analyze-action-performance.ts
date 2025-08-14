
'use server';

/**
 * @fileOverview A flow for analyzing the performance of a marketing action.
 * 
 * - analyzeActionPerformance - A function that analyzes an action and provides suggestions.
 * - AnalyzeActionPerformanceInput - The input type for the analysis function.
 * - AnalyzeActionPerformanceOutput - The return type for the analysis function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestionSchema = z.object({
  suggestion: z.string().describe('A specific, actionable suggestion for improvement.'),
  rationale: z.string().describe('The reasoning behind why this suggestion is being made.'),
});

const AnalyzeActionPerformanceInputSchema = z.object({
  actionContext: z.string().describe('A JSON string representing the full Action object, including its activities, KPIs, expenses, and campaign context.'),
});
export type AnalyzeActionPerformanceInput = z.infer<typeof AnalyzeActionPerformanceInputSchema>;

const AnalyzeActionPerformanceOutputSchema = z.object({
  overallAssessment: z.string().describe('A brief, high-level summary of the action\'s performance so far.'),
  positivePoints: z.array(z.string()).describe('A list of key things that are going well.'),
  areasForImprovement: z.array(z.string()).describe('A list of key areas where performance is lagging or could be better.'),
  actionableSuggestions: z.array(SuggestionSchema).describe('A list of concrete, actionable suggestions to improve the action\'s performance.'),
});
export type AnalyzeActionPerformanceOutput = z.infer<typeof AnalyzeActionPerformanceOutputSchema>;

export async function analyzeActionPerformance(input: AnalyzeActionPerformanceInput): Promise<AnalyzeActionPerformanceOutput> {
  return analyzeActionPerformanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeActionPerformancePrompt',
  input: { schema: AnalyzeActionPerformanceInputSchema },
  output: { schema: AnalyzeActionPerformanceOutputSchema },
  prompt: `You are an expert marketing analyst. Your task is to analyze the performance of a marketing action based on the provided data and give actionable advice. The current date is ${new Date().toLocaleDateString('ru-RU')}.

Analyze the following marketing action data, which is provided as a JSON object:

{{{actionContext}}}

Based on the data, provide a concise and insightful analysis. Structure your response according to the output schema.

Your analysis should consider:
- **Budget vs. Spent:** Is the spending on track? Is it over or under budget?
- **KPI Performance:** Are the Key Performance Indicators (KPIs) meeting their targets? Compare 'current' values to 'target' values. Pay special attention to conversion rates between linked KPIs (where parentId is used).
- **Financials:** Analyze the revenue, profit, and ROI based on the provided effectiveness data. Are these metrics healthy?
- **Timeline:** How far along is the action? Is the progress reasonable for the time elapsed?
- **Overall Cohesion:** Do the numbers tell a consistent story? For example, if spending is high but KPIs are low, that's a red flag.

When providing suggestions, they must be concrete and actionable. Do not give vague advice. For example, instead of "Improve social media," suggest "The Instagram activity has a low click-through rate. Consider revising the ad creative or targeting a different audience segment to improve engagement."

The entire analysis must be in Russian.`,
});

const analyzeActionPerformanceFlow = ai.defineFlow(
  {
    name: 'analyzeActionPerformanceFlow',
    inputSchema: AnalyzeActionPerformanceInputSchema,
    outputSchema: AnalyzeActionPerformanceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
