
'use server';

/**
 * @fileOverview A flow for generating marketing action ideas for a campaign.
 * 
 * - generateActionIdeas - A function that generates ideas based on a campaign's context.
 * - GenerateActionIdeasInput - The input type for the generation function.
 * - GenerateActionIdeasOutput - The return type for the generation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NewActionIdeaSchema = z.object({
  name: z.string().describe('A short, catchy name for the new marketing action.'),
  description: z.string().describe('A brief but compelling description of the new action idea.'),
  targetAudience: z.string().describe("The suggested target audience for this new action."),
});

const GenerateActionIdeasInputSchema = z.object({
  campaignContext: z.string().describe('A JSON string representing the full Campaign object, including its goals and existing actions.'),
});
export type GenerateActionIdeasInput = z.infer<typeof GenerateActionIdeasInputSchema>;

const GenerateActionIdeasOutputSchema = z.object({
  recommendationsForExisting: z.array(z.string()).describe('A list of recommendations to improve the existing actions within the campaign.'),
  newActionIdeas: z.array(NewActionIdeaSchema).describe('A list of new, creative ideas for marketing actions.'),
});
export type GenerateActionIdeasOutput = z.infer<typeof GenerateActionIdeasOutputSchema>;

export async function generateActionIdeas(input: GenerateActionIdeasInput): Promise<GenerateActionIdeasOutput> {
  return generateActionIdeasFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateActionIdeasPrompt',
  input: { schema: GenerateActionIdeasInputSchema },
  output: { schema: GenerateActionIdeasOutputSchema },
  prompt: `You are an expert marketing strategist. Your task is to analyze a marketing campaign and suggest ways to improve it by providing recommendations for existing actions and proposing new ones. The current date is ${new Date().toLocaleDateString('ru-RU')}.

Analyze the following marketing campaign data, which is provided as a JSON object:

{{{campaignContext}}}

Based on the data, provide a concise and insightful analysis. Structure your response according to the output schema.

Your analysis should consider:
- **Campaign Goals:** How well do the current actions align with the overall campaign goals (e.g., sales, awareness)?
- **Existing Actions:** Are there gaps in the current strategy? Are the existing actions comprehensive enough?
- **Target Audience:** Are there untapped segments of the target audience?

**Your Output:**
1.  **Recommendations for Existing Actions:** Provide specific, actionable advice on how to improve the actions already planned or in progress. If there are no existing actions, this array can be empty.
2.  **New Action Ideas:** Generate a list of new, creative, and relevant action ideas. For each idea, provide a catchy name, a brief description, and a suggested target audience. These ideas should complement the existing actions and help achieve the campaign's goals.

The entire analysis must be in Russian.`,
});

const generateActionIdeasFlow = ai.defineFlow(
  {
    name: 'generateActionIdeasFlow',
    inputSchema: GenerateActionIdeasInputSchema,
    outputSchema: GenerateActionIdeasOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
