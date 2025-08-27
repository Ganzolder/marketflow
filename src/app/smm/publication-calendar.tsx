

"use client";

import { useMemo } from 'react';
import type { SocialPost } from "@/lib/types";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, isSameDay, getDay, isSameMonth } from 'date-fns';
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
  const today = useMemo(() => new Date(), []);
  
  const { postsByDate, allPostsByDate, calendarGrid } = useMemo(() => {
    const firstMonthStart = startOfMonth(today);
    const secondMonthEnd = endOfMonth(addMonths(today, 1));
    const allDays = eachDayOfInterval({ start: firstMonthStart, end: secondMonthEnd });

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
    
    // Create grid structure
    const grid: { day: Date | null, month: number }[][] = Array(7).fill(0).map(() => []);
    const monthLabels: { label: string, colIndex: number }[] = [];
    
    let currentColIndex = -1;
    let lastMonth = -1;

    allDays.forEach(day => {
      // Adjust day of week so Monday is 0, Sunday is 6
      const dayOfWeek = (getDay(day) + 6) % 7; 
      
      if (day.getDate() === 1 || (dayOfWeek === 0 && currentColIndex < grid[0].length)) {
        if (day.getMonth() !== lastMonth) {
          lastMonth = day.getMonth();
          currentColIndex = grid[0].length; // Start a new column
          monthLabels.push({ label: format(day, 'LLLL', { locale: ru }), colIndex: currentColIndex });
        }
      }

      // Add day to the correct row (day of week)
      if (grid[dayOfWeek].length <= currentColIndex) {
         // Pad previous rows in this column if needed
        for (let i = 0; i < 7; i++) {
          while (grid[i].length <= currentColIndex) {
            grid[i].push({ day: null, month: -1 });
          }
        }
      }
      
      grid[dayOfWeek][currentColIndex] = { day, month: day.getMonth() };
    });

    // Trim empty starting cells for the first month
    if (grid[0][0].day === null) {
      for(let i=0; i<7; i++){
        const firstDayOfWeek = (getDay(firstMonthStart) + 6) % 7;
        if(i < firstDayOfWeek) {
           grid[i][0] = { day: null, month: -1 }; // Mark as placeholder
        }
      }
    }

    return { postsByDate, allPostsByDate, calendarGrid: { grid, monthLabels } };
  }, [posts, allPosts, today]);
  
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
     <Card>
        <CardHeader>
            <CardTitle>График публикаций</CardTitle>
            <CardDescription>Плотность постов на текущий и следующий месяц.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto pb-4">
            <div className="flex gap-4">
               <div className="flex flex-col gap-1 text-xs text-muted-foreground pt-8">
                 {weekDays.map(day => <div key={day} className="h-8 w-6 flex items-center">{day}</div>)}
               </div>
                <div>
                   <div className="grid grid-flow-col auto-cols-max">
                     {calendarGrid.monthLabels.map(({ label, colIndex }) => (
                       <div key={label} className="text-center text-sm font-medium text-muted-foreground pb-2" style={{ gridColumn: colIndex + 1 }}>
                         {label}
                       </div>
                     ))}
                   </div>
                    <div className="grid grid-flow-col auto-cols-max gap-1">
                        {calendarGrid.grid[0].map((_, colIndex) => (
                           <div key={`col-${colIndex}`} className="flex flex-col gap-1">
                               {calendarGrid.grid.map((row, rowIndex) => {
                                   const cell = row[colIndex];
                                   if (!cell || !cell.day) {
                                       return <div key={`empty-${rowIndex}-${colIndex}`} className="h-8 w-8" />;
                                   }
                                   
                                   const day = cell.day;
                                   const dateKey = format(day, 'yyyy-MM-dd');
                                   const data = postsByDate[dateKey] || { count: 0, posts: [] };
                                   const allData = allPostsByDate ? (allPostsByDate[dateKey] || { count: 0 }) : null;
                                   const colorClass = getIntensityColor(data.count);

                                   return (
                                     <Popover key={day.toString()}>
                                          <PopoverTrigger asChild>
                                              <div className={cn(
                                                  "h-8 w-8 rounded-sm cursor-pointer flex items-center justify-center relative", 
                                                  colorClass,
                                                  isSameDay(day, today) && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                                              )}>
                                                   <span className="text-xs font-medium text-foreground mix-blend-plus-lighter">{day.getDate()}</span>
                                                   {allData && allData.count > 0 && (
                                                       <span className="absolute -top-1 -right-1 text-xs font-bold bg-background text-foreground rounded-full h-4 w-4 flex items-center justify-center border text-center leading-none">
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
                        ))}
                    </div>
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
