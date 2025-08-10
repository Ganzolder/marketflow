// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview Ad copy generation flow for marketing campaigns.
 *
 * - generateAdCopy - A function that generates ad copy variations.
 * - GenerateAdCopyInput - The input type for the generateAdCopy function.
 * - GenerateAdCopyOutput - The return type for the generateAdCopy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAdCopyInputSchema = z.object({
  productName: z.string().describe('The name of the product or service.'),
  targetAudience: z.string().describe('The target audience for the ad.'),
  campaignGoal: z.string().describe('The goal of the marketing campaign (e.g., increase sales, brand awareness).'),
  tone: z.string().describe('The desired tone of the ad copy (e.g., professional, humorous, friendly).'),
  keywords: z.string().describe('Keywords related to the product or service.'),
  numberOfVariations: z.number().default(3).describe('The number of ad copy variations to generate.'),
});

export type GenerateAdCopyInput = z.infer<typeof GenerateAdCopyInputSchema>;

const GenerateAdCopyOutputSchema = z.object({
  adCopies: z.array(z.string()).describe('An array of generated ad copy variations.'),
});

export type GenerateAdCopyOutput = z.infer<typeof GenerateAdCopyOutputSchema>;

export async function generateAdCopy(input: GenerateAdCopyInput): Promise<GenerateAdCopyOutput> {
  return generateAdCopyFlow(input);
}

const generateAdCopyPrompt = ai.definePrompt({
  name: 'generateAdCopyPrompt',
  input: {schema: GenerateAdCopyInputSchema},
  output: {schema: GenerateAdCopyOutputSchema},
  prompt: `You are an expert marketing copywriter. Generate {{numberOfVariations}} ad copy variations for the following product or service:

Product Name: {{{productName}}}
Target Audience: {{{targetAudience}}}
Campaign Goal: {{{campaignGoal}}}
Tone: {{{tone}}}
Keywords: {{{keywords}}}

Each ad copy variation should be concise and engaging, tailored to the target audience, and optimized for the campaign goal. The tone should be appropriate for the product and audience. Incorporate relevant keywords to improve searchability.

Your output should be an array of strings, where each string is an ad copy variation.`,
});

const generateAdCopyFlow = ai.defineFlow(
  {
    name: 'generateAdCopyFlow',
    inputSchema: GenerateAdCopyInputSchema,
    outputSchema: GenerateAdCopyOutputSchema,
  },
  async input => {
    const {output} = await generateAdCopyPrompt(input);
    return output!;
  }
);
