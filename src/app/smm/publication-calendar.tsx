

"use client";

import { useMemo } from 'react';
import type { SocialPost } from "@/lib/types";
import { format, subMonths, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, getDay, startOfMonth, endOfMonth, addMonths, isSameMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

type PostsByDate = {
  [key: string]: {
    count: number;
    posts: Pick<SocialPost, 'title' | 'text'>[];
  }
};

const getIntensityColor = (count: number) => {
  if (count === 0) return 'bg-muted/50';
  if (count === 1) return 'bg-primary/20';
  if (count === 2) return 'bg-primary/40';
  if (count === 3) return 'bg-primary/60';
  if (count >= 4) return 'bg-primary/80';
  return 'bg-muted';
};

export function PublicationCalendar({ posts, allPosts }: { posts: SocialPost[], allPosts?: SocialPost[] }) {
  const { startDate, postsByDate, allPostsByDate } = useMemo(() => {
    const today = new Date();
    const startDate = startOfMonth(today);

    const processPosts = (postList: SocialPost[]): PostsByDate => {
        return postList.reduce((acc, post) => {
            const dateKey = format(new Date(post.publicationDate), 'yyyy-MM-dd');
            if (!acc[dateKey]) {
                acc[dateKey] = { count: 0, posts: [] };
            }
            acc[dateKey].count += 1;
            acc[dateKey].posts.push({ title: post.title, text: post.text });
            return acc;
        }, {} as PostsByDate);
    }
    
    const postsByDate = processPosts(posts);
    const allPostsByDate = allPosts ? processPosts(allPosts) : null;

    return { startDate, postsByDate, allPostsByDate };
  }, [posts, allPosts]);
  
  const today = new Date();
  const firstMonthStart = startOfMonth(today);
  const secondMonthStart = startOfMonth(addMonths(today, 1));
  const secondMonthEnd = endOfMonth(addMonths(today, 1));

  const allDays = eachDayOfInterval({ start: firstMonthStart, end: secondMonthEnd });
  
  const weekDays = ['Пн', 'Ср', 'Пт'];
  const monthLabels = [
      { label: format(firstMonthStart, 'LLLL', { locale: ru }), month: firstMonthStart.getMonth() },
      { label: format(secondMonthStart, 'LLLL', { locale: ru }), month: secondMonthStart.getMonth() }
  ];

  return (
     <Card>
        <CardHeader>
            <CardTitle>График публикаций</CardTitle>
            <CardDescription>Плотность постов на текущий и следующий месяц.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto pb-4">
            <div className="flex gap-4 items-end">
               <div className="flex flex-col gap-2 text-xs text-muted-foreground self-stretch justify-around pr-2">
                 {weekDays.map(day => <div key={day}>{day}</div>)}
               </div>
                <div className="grid grid-rows-7 grid-flow-col auto-cols-max gap-1">
                    {allDays.map(day => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const data = postsByDate[dateKey] || { count: 0, posts: [] };
                        const allData = allPostsByDate ? (allPostsByDate[dateKey] || { count: 0 }) : null;
                        const colorClass = getIntensityColor(data.count);

                        return (
                            <Popover key={day.toString()}>
                                <PopoverTrigger asChild>
                                    <div className={cn("h-8 w-8 rounded-sm cursor-pointer flex items-center justify-center", colorClass)}>
                                        {data.count > 0 && (
                                            <span className="text-xs font-bold text-primary-foreground mix-blend-difference">
                                                {allData ? `${data.count}/${allData.count}` : data.count}
                                            </span>
                                        )}
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent>
                                    <p className="font-bold">{format(day, 'd MMMM yyyy г.', { locale: ru })}</p>
                                    {data.count > 0 ? (
                                        <div className="mt-1 text-xs space-y-1">
                                            <p className="font-semibold">{data.count} {data.count === 1 ? 'пост' : data.count > 1 && data.count < 5 ? 'поста' : 'постов'} в этой акции:</p>
                                            <ul className="list-disc list-inside">
                                                {data.posts.map((p, i) => <li key={i} className="truncate max-w-xs">{p.title || p.text}</li>)}
                                            </ul>
                                             {allData && allData.count > data.count && (
                                                <p className="font-semibold mt-2">Всего постов в этот день: {allData.count}</p>
                                             )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">Нет постов в этот день</p>
                                    )}
                                </PopoverContent>
                            </Popover>
                        )
                    })}
                </div>
            </div>
           <div className="flex justify-end items-center gap-2 text-xs text-muted-foreground mt-4">
                <span>Меньше</span>
                <div className="h-3 w-3 rounded-sm bg-primary/20" />
                <div className="h-3 w-3 rounded-sm bg-primary/40" />
                <div className="h-3 w-3 rounded-sm bg-primary/60" />
                <div className="h-3 w-3 rounded-sm bg-primary/80" />
                <span>Больше</span>
            </div>
        </CardContent>
    </Card>
  );
}
