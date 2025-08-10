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
  productName: z.string().describe('Название продукта или услуги.'),
  targetAudience: z.string().describe('Целевая аудитория для рекламы.'),
  campaignGoal: z.string().describe('Цель маркетинговой кампании (например, увеличение продаж, узнаваемость бренда).'),
  tone: z.string().describe('Желаемый тон рекламного текста (например, профессиональный, юмористический, дружелюбный).'),
  keywords: z.string().describe('Ключевые слова, связанные с продуктом или услугой.'),
  numberOfVariations: z.number().default(3).describe('Количество вариантов рекламного текста для генерации.'),
});

export type GenerateAdCopyInput = z.infer<typeof GenerateAdCopyInputSchema>;

const GenerateAdCopyOutputSchema = z.object({
  adCopies: z.array(z.string()).describe('Массив сгенерированных вариантов рекламного текста.'),
});

export type GenerateAdCopyOutput = z.infer<typeof GenerateAdCopyOutputSchema>;

export async function generateAdCopy(input: GenerateAdCopyInput): Promise<GenerateAdCopyOutput> {
  return generateAdCopyFlow(input);
}

const generateAdCopyPrompt = ai.definePrompt({
  name: 'generateAdCopyPrompt',
  input: {schema: GenerateAdCopyInputSchema},
  output: {schema: GenerateAdCopyOutputSchema},
  prompt: `Вы — эксперт по написанию рекламных текстов. Создайте {{numberOfVariations}} вариантов рекламного текста для следующего продукта или услуги:

Название продукта: {{{productName}}}
Целевая аудитория: {{{targetAudience}}}
Цель кампании: {{{campaignGoal}}}
Тон: {{{tone}}}
Ключевые слова: {{{keywords}}}

Каждый вариант рекламного текста должен быть кратким и привлекательным, адаптированным для целевой аудитории и оптимизированным для цели кампании. Тон должен соответствовать продукту и аудитории. Включите релевантные ключевые слова для улучшения поисковой выдачи.

Ваш результат должен быть массивом строк, где каждая строка — это вариант рекламного текста.`,
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
