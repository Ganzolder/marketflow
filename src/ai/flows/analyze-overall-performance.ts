
'use server';

/**
 * @fileOverview A flow for analyzing the overall performance of all marketing activities.
 * 
 * - analyzeOverallPerformance - A function that analyzes all data and provides suggestions.
 * - AnalyzeOverallPerformanceInput - The input type for the analysis function.
 * - AnalyzeOverallPerformanceOutput - The return type for the analysis function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestionSchema = z.object({
  suggestion: z.string().describe('A specific, actionable suggestion for improvement.'),
  rationale: z.string().describe('The reasoning behind why this suggestion is being made.'),
  priority: z.enum(['high', 'medium', 'low']).describe('The priority of the suggestion.'),
});

const AnalyzeOverallPerformanceInputSchema = z.object({
  allDataContext: z.string().describe('A JSON string representing all campaigns, actions, tasks, and social posts.'),
});
export type AnalyzeOverallPerformanceInput = z.infer<typeof AnalyzeOverallPerformanceInputSchema>;

const AnalyzeOverallPerformanceOutputSchema = z.object({
  executiveSummary: z.string().describe('A brief, high-level summary of the entire marketing operation\'s performance.'),
  keySuccesses: z.array(z.string()).describe('A list of key strategic things that are going well across multiple campaigns or areas.'),
  keyChallenges: z.array(z.string()).describe('A list of key strategic challenges or problems observed across the board.'),
  strategicRecommendations: z.array(SuggestionSchema).describe('A list of high-level, strategic recommendations to improve overall performance.'),
});
export type AnalyzeOverallPerformanceOutput = z.infer<typeof AnalyzeOverallPerformanceOutputSchema>;

export async function analyzeOverallPerformance(input: AnalyzeOverallPerformanceInput): Promise<AnalyzeOverallPerformanceOutput> {
  return analyzeOverallPerformanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeOverallPerformancePrompt',
  input: { schema: AnalyzeOverallPerformanceInputSchema },
  output: { schema: AnalyzeOverallPerformanceOutputSchema },
  prompt: `You are a Chief Marketing Officer (CMO) AI assistant. Your task is to conduct a high-level, strategic analysis of the entire marketing operation based on the provided data. The current date is ${new Date().toLocaleDateString('ru-RU')}.

Analyze the following data dump, which contains all campaigns, actions, tasks, and social media posts:

{{{allDataContext}}}

Based on the data, provide a concise and insightful strategic analysis. Structure your response according to the output schema.

Your analysis should consider:
- **Financial Health:** What is the overall ROI? Is spending efficient across campaigns? Are there outlier campaigns (highly profitable or unprofitable)?
- **Performance Trends:** Are KPIs generally being met? Are there common patterns of success or failure in certain types of actions or social media platforms?
- **Operational Efficiency:** Are tasks being completed on time? Are resources being managed effectively? Is there a good balance between planning and execution?
- **Strategic Alignment:** Do the ongoing activities align with campaign goals? Are there any gaps or opportunities being missed?

When providing suggestions, they must be strategic and impactful. Prioritize them based on what will provide the most value.

The entire analysis must be in Russian.`,
});

const analyzeOverallPerformanceFlow = ai.defineFlow(
  {
    name: 'analyzeOverallPerformanceFlow',
    inputSchema: AnalyzeOverallPerformanceInputSchema,
    outputSchema: AnalyzeOverallPerformanceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
