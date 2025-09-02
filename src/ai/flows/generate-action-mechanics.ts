
'use server';

/**
 * @fileOverview A flow for generating a detailed marketing action mechanics brief for an employee.
 * 
 * - generateActionMechanics - A function that generates the brief based on action and campaign context.
 * - GenerateActionMechanicsInput - The input type for the generation function.
 * - GenerateActionMechanicsOutput - The return type for the generation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateActionMechanicsInputSchema = z.object({
  actionContext: z.string().describe('A JSON string representing the full Action object, including its context within the Campaign.'),
});
export type GenerateActionMechanicsInput = z.infer<typeof GenerateActionMechanicsInputSchema>;

const GenerateActionMechanicsOutputSchema = z.object({
  mechanicsBrief: z.string().describe('The generated, detailed brief for an employee on how to execute the action.'),
});
export type GenerateActionMechanicsOutput = z.infer<typeof GenerateActionMechanicsOutputSchema>;

export async function generateActionMechanics(input: GenerateActionMechanicsInput): Promise<GenerateActionMechanicsOutput> {
  return generateActionMechanicsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateActionMechanicsPrompt',
  input: { schema: GenerateActionMechanicsInputSchema },
  output: { schema: GenerateActionMechanicsOutputSchema },
  prompt: `You are an experienced marketing manager creating a detailed brief for a front-line employee (e.g., a sales associate, a store manager).
Your task is to write a clear, step-by-step guide on how to execute a specific marketing action.
The brief should be written in Russian, be very practical, and cover all necessary aspects of the action's execution.

Analyze the following marketing action data, provided as a JSON object:
{{{actionContext}}}

Based on this data, generate a "Механика акции" document. Structure it like a brief or an internal instruction manual.

The brief must include the following sections if applicable:
1.  **Цель акции:** Briefly explain what we want to achieve with this action.
2.  **Период и место проведения:** Clearly state the start and end dates, and the address.
3.  **Условия для клиента:** Describe exactly what the customer needs to do to participate (e.g., "buy product X", "show this coupon"). Explain the benefit for the customer (e.g., "gets a 20% discount").
4.  **Ваша задача (что делать сотруднику):** This is the most important part. Provide a step-by-step process for the employee.
    - How to greet the customer and introduce the action.
    - What to say to explain the conditions.
    - How to process the discount or bonus in the CRM or cash register system.
    - What data needs to be collected (e.g., "ask for the customer's phone number", "record the use of a promo code").
    - What to do if the customer has questions or issues.
5.  **Отчетность:** Explain what information the employee needs to report at the end of their shift or the day (e.g., "report the number of participants", "submit a list of used promo codes").
6.  **Ответственные:** List the key contacts for questions (use the names from the action data if provided).

The entire output must be a single string of text, formatted with clear headings and lists. Use markdown for formatting. Be concise but thorough.
The tone should be encouraging and professional.
`,
});

const generateActionMechanicsFlow = ai.defineFlow(
  {
    name: 'generateActionMechanicsFlow',
    inputSchema: GenerateActionMechanicsInputSchema,
    outputSchema: GenerateActionMechanicsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
