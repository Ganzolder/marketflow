// The directive tells Next.js it's a server-side module.
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating creative marketing campaign ideas.
 *
 * The flow takes a product/service description as input and returns a list of campaign ideas.
 *
 * @module src/ai/flows/generate-campaign-ideas
 *
 * @interface GenerateCampaignIdeasInput - The input type for the generateCampaignIdeas function.
 * @interface GenerateCampaignIdeasOutput - The output type for the generateCampaignIdeas function.
 * @function generateCampaignIdeas - A function that handles the campaign idea generation process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCampaignIdeasInputSchema = z.object({
  productDescription: z
    .string()
    .describe('A brief description of the product or service.'),
});

export type GenerateCampaignIdeasInput = z.infer<
  typeof GenerateCampaignIdeasInputSchema
>;

const GenerateCampaignIdeasOutputSchema = z.object({
  campaignIdeas: z
    .array(z.string())
    .describe('A list of creative marketing campaign ideas.'),
});

export type GenerateCampaignIdeasOutput = z.infer<
  typeof GenerateCampaignIdeasOutputSchema
>;

export async function generateCampaignIdeas(
  input: GenerateCampaignIdeasInput
): Promise<GenerateCampaignIdeasOutput> {
  return generateCampaignIdeasFlow(input);
}

const generateCampaignIdeasPrompt = ai.definePrompt({
  name: 'generateCampaignIdeasPrompt',
  input: {schema: GenerateCampaignIdeasInputSchema},
  output: {schema: GenerateCampaignIdeasOutputSchema},
  prompt: `You are a marketing expert. Generate a list of creative marketing campaign ideas for the following product or service description: {{{productDescription}}}. Return them as an array of strings.
`,
});

const generateCampaignIdeasFlow = ai.defineFlow(
  {
    name: 'generateCampaignIdeasFlow',
    inputSchema: GenerateCampaignIdeasInputSchema,
    outputSchema: GenerateCampaignIdeasOutputSchema,
  },
  async input => {
    const {output} = await generateCampaignIdeasPrompt(input);
    return output!;
  }
);
