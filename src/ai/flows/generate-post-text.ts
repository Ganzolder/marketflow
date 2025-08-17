// The directive tells Next.js it's a server-side module.
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating social media post text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GeneratePostTextInputSchema = z.object({
  topic: z.string().describe('Основная тема или идея для поста.'),
  productName: z.string().describe('Название продукта или услуги, связанной с постом.'),
  targetAudience: z.string().describe('Целевая аудитория, для которой предназначен пост.'),
  tone: z.string().describe('Желаемый тон рекламного текста (например, профессиональный, юмористический, дружелюбный).'),
});

export type GeneratePostTextInput = z.infer<typeof GeneratePostTextInputSchema>;

const GeneratePostTextOutputSchema = z.object({
  postText: z.string().describe('Сгенерированный текст для поста в социальных сетях.'),
});

export type GeneratePostTextOutput = z.infer<typeof GeneratePostTextOutputSchema>;

export async function generatePostText(
  input: GeneratePostTextInput
): Promise<GeneratePostTextOutput> {
  return generatePostTextFlow(input);
}

const generatePostTextPrompt = ai.definePrompt({
  name: 'generatePostTextPrompt',
  input: { schema: GeneratePostTextInputSchema },
  output: { schema: GeneratePostTextOutputSchema },
  prompt: `Вы — эксперт по SMM. Напишите привлекательный и содержательный пост для социальных сетей.

Информация для поста:
- **Тема/идея:** {{{topic}}}
- **Продукт/услуга:** {{{productName}}}
- **Целевая аудитория:** {{{targetAudience}}}
- **Тон:** {{{tone}}}

Ваш текст должен быть ясным, кратким и соответствовать указанному тону. Убедитесь, что он будет интересен целевой аудитории. Не используйте markdown.`,
});

const generatePostTextFlow = ai.defineFlow(
  {
    name: 'generatePostTextFlow',
    inputSchema: GeneratePostTextInputSchema,
    outputSchema: GeneratePostTextOutputSchema,
  },
  async input => {
    const { output } = await generatePostTextPrompt(input);
    return output!;
  }
);
