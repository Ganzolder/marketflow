'use server';

/**
 * @fileOverview A flow for rephrasing text into a more formal, step-by-step guide for an employee.
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
  prompt: `You are an experienced marketing manager. Your task is to take the following raw text and transform it into a clear, structured, step-by-step instruction manual (brief) for a front-line employee.

The output must be in Russian.
The tone should be professional, clear, and encouraging.
Use markdown for formatting, especially numbered lists for employee actions (e.g., "1. Сделайте...", "2. Скажите...").

If the original text contains sections like "Цель", "Условия", "Что делать сотруднику", preserve them as headings. The most important part is to convert any free-form description of employee tasks into a clear, numbered, step-by-step list.

For example, if the input is "сотрудник должен сказать клиенту про скидку и потом пробить чек", the output should be something like:
"1. Сообщите клиенту о действующей скидке.
2. Пробейте чек с учетом скидки."

Now, rephrase the following text:
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
