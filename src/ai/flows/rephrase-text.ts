'use server';

/**
 * @fileOverview A flow for rephrasing text into a more formal style.
 * 
 * - rephraseText - A function that takes text and returns a formal version.
 * - RephraseTextInput - The input type for the rephrasing function.
 * - RephraseTextOutput - The return type for the rephrasing function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RephraseTextInputSchema = z.object({
  text: z.string().describe('The text to be rephrased.'),
});
export type RephraseTextInput = z.infer<typeof RephraseTextInputSchema>;

const RephraseTextOutputSchema = z.object({
  rephrasedText: z.string().describe('The rephrased, formal text.'),
});
export type RephraseTextOutput = z.infer<typeof RephraseTextOutputSchema>;

export async function rephraseText(input: RephraseTextInput): Promise<RephraseTextOutput> {
  return rephraseTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'rephraseTextPrompt',
  input: { schema: RephraseTextInputSchema },
  output: { schema: RephraseTextOutputSchema },
  prompt: `Перефразируй следующий текст в официальном, деловом стиле. Сохрани основной смысл, но сделай его более структурированным, ясным и профессиональным. Не используй markdown.

Текст для перефразирования:
"{{text}}"`,
});

const rephraseTextFlow = ai.defineFlow(
  {
    name: 'rephraseTextFlow',
    inputSchema: RephraseTextInputSchema,
    outputSchema: RephraseTextOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
