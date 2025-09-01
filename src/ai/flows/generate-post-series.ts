
'use server';

/**
 * @fileOverview A Genkit flow for generating a series of social media posts for a marketing action.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { SocialPlatforms, type SocialPlatform } from '@/lib/types';

function generatePromoCode(length = 5) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const GeneratePostSeriesInputSchema = z.object({
  actionName: z.string().describe('Название маркетинговой акции.'),
  actionDescription: z.string().describe('Описание маркетинговой акции.'),
  actionConditions: z.string().describe('Условия проведения акции.'),
  additionalInfo: z.string().optional().describe('Дополнительная информация или ключевые моменты, которые нужно обязательно упомянуть в постах.'),
  platforms: z.array(z.nativeEnum(SocialPlatforms)).describe('Список социальных сетей для публикации.'),
  dates: z.array(z.string().refine(d => !isNaN(Date.parse(d)))).describe('Массив дат для публикации постов в формате YYYY-MM-DD.'),
});

export type GeneratePostSeriesInput = z.infer<typeof GeneratePostSeriesInputSchema>;

const GeneratedPostSchema = z.object({
    title: z.string().describe('Яркий заголовок для поста.'),
    text: z.string().describe('Полный текст поста, включая уникальные промокоды, если они были сгенерированы.'),
    platforms: z.array(z.nativeEnum(SocialPlatforms)).describe('Социальные сети, для которых предназначен пост.'),
    publicationDate: z.string().describe('Дата публикации поста в формате YYYY-MM-DD.'),
    promoCodes: z.record(z.string()).optional().describe('Объект с уникальными промокодами для каждой платформы.'),
});

const GeneratePostSeriesOutputSchema = z.object({
  posts: z.array(GeneratedPostSchema).describe('Массив сгенерированных постов.'),
});

export type GeneratePostSeriesOutput = z.infer<typeof GeneratePostSeriesOutputSchema>;


export async function generatePostSeries(
  input: GeneratePostSeriesInput
): Promise<GeneratePostSeriesOutput> {
  return generatePostSeriesFlow(input);
}


const generatePostSeriesFlow = ai.defineFlow(
  {
    name: 'generatePostSeriesFlow',
    inputSchema: GeneratePostSeriesInputSchema,
    outputSchema: GeneratePostSeriesOutputSchema,
  },
  async (input) => {
    const generatedPosts: z.infer<typeof GeneratedPostSchema>[] = [];
    
    // Generate a unique promo code for each platform
    const promoCodesByPlatform: Record<string, string> = {};
    input.platforms.forEach(platform => {
        promoCodesByPlatform[platform] = generatePromoCode();
    });
    
    const promoCodesString = Object.entries(promoCodesByPlatform)
      .map(([platform, code]) => `${platform}: ${code}`)
      .join(', ');

    const prompt = ai.definePrompt({
        name: 'generateSinglePostForSeries',
        input: { schema: z.object({ 
            actionName: z.string(), 
            actionDescription: z.string(),
            actionConditions: z.string(),
            additionalInfo: z.string().optional(),
            platforms: z.array(z.nativeEnum(SocialPlatforms)),
            promoCodes: z.string(),
            publicationDate: z.string(),
            allDates: z.array(z.string()),
            postIndex: z.number(),
        }) },
        output: { schema: z.object({ title: z.string(), text: z.string() }) },
        prompt: `Ты — опытный SMM-менеджер. Твоя задача — написать пост для социальных сетей.

**Контекст:**
- **Акция:** {{{actionName}}}
- **Описание акции:** {{{actionDescription}}}
- **Условия акции:** {{{actionConditions}}}
- **Социальные сети для публикации:** {{#each platforms}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- **Дата публикации этого поста:** {{{publicationDate}}}
- **Всего дат публикаций:** {{{allDates}}} (этот пост номер {{postIndex}} из {{allDates.length}})
- **Дополнительная информация, которую нужно учесть:** {{{additionalInfo}}}
- **Уникальные промокоды для каждой платформы:** **{{{promoCodes}}}**

**Задача:**
Напиши креативный и привлекательный пост. Адаптируй текст так, чтобы он хорошо смотрелся во всех указанных соцсетях ({{{platforms}}}).
Обязательно включи в текст все промокоды. Ты можешь написать что-то вроде: "Используйте промокод для вашей любимой соцсети: VK - XCODE, Telegram - YCODE".
Сделай пост уникальным, учитывая, что это часть серии публикаций. Не повторяйся.

**Требования к результату:**
- Текст должен быть на русском языке.
- Не используй markdown.
- Результат должен быть в формате JSON с полями 'title' и 'text'.`,
    });

    let postIndex = 1;
    for (const date of input.dates) {
      const result = await prompt({
          ...input,
          promoCodes: promoCodesString,
          publicationDate: date,
          allDates: input.dates,
          postIndex: postIndex,
      });

      if (result.output) {
        generatedPosts.push({
          ...result.output,
          platforms: input.platforms,
          publicationDate: date,
          promoCodes: promoCodesByPlatform,
        });
      }
      postIndex++;
    }

    return { posts: generatedPosts };
  }
);
