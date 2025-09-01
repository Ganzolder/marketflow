
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
    text: z.string().describe('Полный текст поста, включая уникальный промокод, если он был сгенерирован.'),
    platform: z.nativeEnum(SocialPlatforms).describe('Социальная сеть, для которой предназначен пост.'),
    publicationDate: z.string().describe('Дата публикации поста в формате YYYY-MM-DD.'),
    promoCode: z.string().optional().describe('Уникальный промокод, если он был сгенерирован для этого поста.'),
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
    const promoCodesByPlatform: Record<SocialPlatform, string> = {} as Record<SocialPlatform, string>;
    input.platforms.forEach(platform => {
        promoCodesByPlatform[platform] = generatePromoCode();
    });

    const prompt = ai.definePrompt({
        name: 'generateSinglePostForSeries',
        input: { schema: z.object({ 
            actionName: z.string(), 
            actionDescription: z.string(),
            actionConditions: z.string(),
            additionalInfo: z.string().optional(),
            platform: z.nativeEnum(SocialPlatforms),
            promoCode: z.string(),
            publicationDate: z.string(),
            allDates: z.array(z.string()),
            postIndex: z.number(),
        }) },
        output: { schema: z.object({ title: z.string(), text: z.string() }) },
        prompt: `Ты — опытный SMM-менеджер. Твоя задача — написать пост для социальной сети.

**Контекст:**
- **Акция:** {{{actionName}}}
- **Описание акции:** {{{actionDescription}}}
- **Условия акции:** {{{actionConditions}}}
- **Социальная сеть:** {{{platform}}}
- **Дата публикации этого поста:** {{{publicationDate}}}
- **Всего дат публикаций:** {{{allDates}}} (этот пост номер {{postIndex}} из {{allDates.length}})
- **Дополнительная информация, которую нужно учесть:** {{{additionalInfo}}}
- **Уникальный промокод для этого поста:** **{{{promoCode}}}**

**Задача:**
Напиши креативный и привлекательный пост. Учти особенности выбранной социальной сети ({{platform}}).
Обязательно включи в текст промокод **{{{promoCode}}}**.
Сделай пост уникальным, учитывая, что это часть серии публикаций. Не повторяйся.

**Требования к результату:**
- Текст должен быть на русском языке.
- Не используй markdown.
- Результат должен быть в формате JSON с полями 'title' и 'text'.`,
    });

    let postIndex = 1;
    for (const date of input.dates) {
      for (const platform of input.platforms) {
        const promoCode = promoCodesByPlatform[platform];
        const result = await prompt({
            ...input,
            platform,
            promoCode,
            publicationDate: date,
            allDates: input.dates,
            postIndex: postIndex,
        });

        if (result.output) {
          generatedPosts.push({
            ...result.output,
            platform,
            publicationDate: date,
            promoCode,
          });
        }
        postIndex++;
      }
    }

    return { posts: generatedPosts };
  }
);
