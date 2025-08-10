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
    .describe('Краткое описание продукта или услуги.'),
});

export type GenerateCampaignIdeasInput = z.infer<
  typeof GenerateCampaignIdeasInputSchema
>;

const GenerateCampaignIdeasOutputSchema = z.object({
  campaignIdeas: z
    .array(z.string())
    .describe('Список креативных идей для маркетинговых кампаний.'),
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
  prompt: `Вы — эксперт по маркетингу. Создайте список креативных идей для маркетинговых кампаний для следующего описания продукта или услуги: {{{productDescription}}}. Верните их в виде массива строк.
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
