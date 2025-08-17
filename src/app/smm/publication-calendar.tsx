"use client";

import { useMemo } from 'react';
import type { SocialPost } from "@/lib/types";
import { format, subMonths, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, getDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

type PostsByDate = {
  [key: string]: {
    count: number;
    posts: Pick<SocialPost, 'text'>[];
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

export function PublicationCalendar({ posts }: { posts: SocialPost[] }) {
  const { startDate, endDate, postsByDate, weekDays, monthLabels } = useMemo(() => {
    const endDate = new Date();
    const startDate = subMonths(endDate, 4);

    const postsByDate: PostsByDate = posts.reduce((acc, post) => {
      const dateKey = format(new Date(post.publicationDate), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = { count: 0, posts: [] };
      }
      acc[dateKey].count += 1;
      acc[dateKey].posts.push({ text: post.text });
      return acc;
    }, {} as PostsByDate);

    const weekDays = ['Пн', 'Ср', 'Пт'];

    const monthLabels = Array.from({ length: 5 }).map((_, i) => {
        const date = subMonths(endDate, i);
        return {
            label: format(date, 'MMM', { locale: ru }),
            month: date.getMonth()
        };
    }).reverse();

    return { startDate, endDate, postsByDate, weekDays, monthLabels };
  }, [posts]);

  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Create a grid of weeks
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  allDays.forEach(day => {
    if (getDay(day) === 1 && currentWeek.length > 0) { // Monday starts a new week
        weeks.push(currentWeek);
        currentWeek = [];
    }
    currentWeek.push(day);
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return (
     <Card>
        <CardHeader>
            <CardTitle>График публикаций</CardTitle>
            <CardDescription>Плотность постов за последние 4 месяца.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto pb-4">
          <TooltipProvider>
            <div className="flex gap-4 items-end">
               <div className="flex flex-col gap-2 text-xs text-muted-foreground self-stretch justify-around pr-2">
                 {weekDays.map(day => <div key={day}>{day}</div>)}
               </div>
               <div className="flex flex-col">
                    <div className="flex gap-4 text-xs text-muted-foreground pl-1 mb-2">
                        {monthLabels.map(m => <div key={m.label} className="min-w-[50px]">{m.label}</div>)}
                    </div>
                    <div className="grid grid-flow-col grid-rows-7 gap-1">
                        {allDays.map(day => {
                            const dateKey = format(day, 'yyyy-MM-dd');
                            const data = postsByDate[dateKey] || { count: 0, posts: [] };
                            const colorClass = getIntensityColor(data.count);

                            return (
                                <Tooltip key={day.toString()}>
                                <TooltipTrigger asChild>
                                    <div className={cn("h-4 w-4 rounded-sm", colorClass)} />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-bold">{format(day, 'd MMMM yyyy г.', { locale: ru })}</p>
                                    {data.count > 0 ? (
                                        <div className="mt-1 text-xs">
                                            <p className="font-semibold">{data.count} {data.count === 1 ? 'пост' : data.count > 1 && data.count < 5 ? 'поста' : 'постов'}:</p>
                                            <ul className="list-disc list-inside">
                                                {data.posts.map((p, i) => <li key={i} className="truncate max-w-xs">{p.text}</li>)}
                                            </ul>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">Нет постов</p>
                                    )}
                                </TooltipContent>
                                </Tooltip>
                            )
                        })}
                    </div>
                </div>
            </div>
           </TooltipProvider>
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
