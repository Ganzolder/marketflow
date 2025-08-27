
"use client";

import { useMemo } from 'react';
import type { SocialPost } from "@/lib/types";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, isSameDay, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
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

const CalendarMonth = ({ monthDate, postsByDate, allPostsByDate }: { monthDate: Date; postsByDate: PostsByDate, allPostsByDate: PostsByDate | null }) => {
  const today = useMemo(() => new Date(), []);
  
  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(monthDate), { locale: ru }),
    end: endOfWeek(endOfMonth(monthDate), { locale: ru })
  });

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-center capitalize">{format(monthDate, 'LLLL yyyy', { locale: ru })}</h3>
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const data = postsByDate[dateKey] || { count: 0, posts: [] };
          const allData = allPostsByDate ? (allPostsByDate[dateKey] || { count: 0, posts: [] }) : null;
          const colorClass = getIntensityColor(allData?.count || 0);
          const isCurrentMonth = isSameMonth(day, monthDate);

          return (
            <Popover key={day.toString()}>
              <PopoverTrigger asChild>
                <div className={cn(
                  "h-14 w-14 rounded-md flex flex-col justify-between p-1 relative transition-colors",
                  isCurrentMonth ? 'cursor-pointer hover:ring-2 hover:ring-primary' : 'cursor-default',
                  isCurrentMonth ? colorClass : 'bg-muted/20',
                  isSameDay(day, today) && isCurrentMonth && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                )}>
                    <div className={cn(
                        "text-xs font-medium text-foreground text-center self-start w-full",
                        !isCurrentMonth && "text-muted-foreground/50"
                    )}>
                        {format(day, 'd')}
                    </div>
                  
                  {isCurrentMonth && (allData?.count || 0) > 0 && (
                     <div className="text-center font-bold text-sm text-primary-foreground mix-blend-hard-light self-end w-full pb-1">
                      {allPostsByDate ? `${data.count}/${allData.count}` : data.count}
                    </div>
                  )}
                </div>
              </PopoverTrigger>
              {isCurrentMonth && (
                <PopoverContent className="w-80">
                  <p className="font-bold">{format(day, 'd MMMM yyyy г.', { locale: ru })}</p>
                  {allData && allData.count > 0 ? (
                    <div className="mt-2 text-xs space-y-2">
                       {data.count > 0 && (
                        <>
                            <p className="font-semibold">{data.count} {data.count === 1 ? 'пост' : data.count > 1 && data.count < 5 ? 'поста' : 'постов'} в этой выборке:</p>
                             <ul className="list-disc list-inside max-h-40 overflow-y-auto">
                                {data.posts.map((p, i) => <li key={i} className="truncate max-w-xs">{p.title || p.text}</li>)}
                            </ul>
                        </>
                       )}
                       {allPostsByDate && (
                         <p className="font-semibold mt-2 border-t pt-2">Всего постов в этот день: {allData.count}</p>
                       )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Нет постов в этот день.</p>
                  )}
                </PopoverContent>
              )}
            </Popover>
          )
        })}
      </div>
    </div>
  );
};


export function PublicationCalendar({ posts, allPosts }: { posts: SocialPost[], allPosts?: SocialPost[] }) {
  const today = useMemo(() => new Date(), []);
  const nextMonth = useMemo(() => addMonths(today, 1), [today]);
  
  const { postsByDate, allPostsByDate } = useMemo(() => {
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
    };
    
    const allPostsByDate = allPosts ? processPosts(allPosts) : null;
    let postsByDate: PostsByDate;

    if (allPostsByDate) {
      // If allPosts are provided, ensure postsByDate has keys for all days present in allPostsByDate
      const basePostsByDate = processPosts(posts);
      postsByDate = { ...basePostsByDate };
      for (const dateKey in allPostsByDate) {
        if (!postsByDate[dateKey]) {
          postsByDate[dateKey] = { count: 0, posts: [] };
        }
      }
    } else {
      postsByDate = processPosts(posts);
    }
    
    return { postsByDate, allPostsByDate };
  }, [posts, allPosts]);
  
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
     <Card>
        <CardHeader>
            <CardTitle>График публикаций</CardTitle>
            <CardDescription>Плотность постов на текущий и следующий месяц.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[today, nextMonth].map(monthDate => (
              <div key={format(monthDate, 'yyyy-MM')}>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground mb-2">
                  {weekDays.map(day => <div key={day}>{day}</div>)}
                </div>
                <CalendarMonth monthDate={monthDate} postsByDate={postsByDate} allPostsByDate={allPostsByDate} />
              </div>
            ))}
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
