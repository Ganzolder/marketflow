import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { getAllTasks, getAllSocialPosts } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { ClipboardCheck, Share2, CalendarRange } from 'lucide-react';
import type { EnrichedTask, EnrichedSocialPost } from '@/lib/types';
import { PlanGanttSection } from './plan-gantt-section';
import { PlanPrintButton } from './plan-print-button';

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getDaysRange(days: number): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const keys: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    keys.push(toDateKey(d));
  }
  return keys;
}

function filterTasksForRange(
  tasks: EnrichedTask[],
  startKey: string,
  endKey: string
): EnrichedTask[] {
  return tasks.filter((t) => {
    if (t.isArchived || t.status === 'completed') return false;
    const key = toDateKey(new Date(t.deadline));
    return key >= startKey && key <= endKey;
  });
}

function filterPostsForRange(
  posts: EnrichedSocialPost[],
  startKey: string,
  endKey: string
): EnrichedSocialPost[] {
  return posts.filter((p) => {
    if (p.status === 'published') return false;
    const key = toDateKey(new Date(p.publicationDate));
    return key >= startKey && key <= endKey;
  });
}

function groupByDay<T extends { deadline?: string; publicationDate?: string }>(
  items: T[],
  dateField: 'deadline' | 'publicationDate'
): Record<string, T[]> {
  const map: Record<string, T[]> = {};
  items.forEach((item) => {
    const key = toDateKey(new Date((item as any)[dateField]));
    if (!map[key]) map[key] = [];
    map[key].push(item);
  });
  return map;
}

export default async function PlanPage() {
  const [allTasks, allPosts] = await Promise.all([
    getAllTasks(),
    getAllSocialPosts(),
  ]);

  const todayKey = toDateKey(new Date());
  const weekEndKey = getDaysRange(7)[6];
  const monthEndKey = getDaysRange(30)[29];

  const weekTasks = filterTasksForRange(allTasks, todayKey, weekEndKey);
  const weekPosts = filterPostsForRange(allPosts, todayKey, weekEndKey);
  const monthTasks = filterTasksForRange(allTasks, todayKey, monthEndKey);
  const monthPosts = filterPostsForRange(allPosts, todayKey, monthEndKey);

  const weekTasksByDay = groupByDay(weekTasks, 'deadline');
  const weekPostsByDay = groupByDay(weekPosts, 'publicationDate');
  const monthTasksByDay = groupByDay(monthTasks, 'deadline');
  const monthPostsByDay = groupByDay(monthPosts, 'publicationDate');

  const weekDays = getDaysRange(7);
  const monthDays = getDaysRange(30);
  const locale = 'ru-RU';
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  };

  const taskLink = (t: EnrichedTask) =>
    t.campaignId && t.actionId
      ? `/campaigns/${t.campaignId}/${t.actionId}`
      : '/tasks';
  const postLink = (p: EnrichedSocialPost) =>
    p.campaignId && p.actionId
      ? `/campaigns/${p.campaignId}/${p.actionId}`
      : p.campaignId
        ? `/campaigns/${p.campaignId}`
        : '/smm';

  return (
    <div>
      <PageHeader
        title="Сводный план"
        description="План на неделю и месяц: плановые задачи и посты по всем акциям, календарный график акций."
      >
        <PlanPrintButton />
      </PageHeader>

      <div className="space-y-8">
        <Card className="group-bg-1 border-l-4 border-l-[hsl(var(--group-border))]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5" />
              План на неделю
            </CardTitle>
            <CardDescription>
              Плановые задачи и запланированные публикации на ближайшие 7 дней.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {weekDays.map((dayKey) => {
                const tasks = weekTasksByDay[dayKey] ?? [];
                const posts = weekPostsByDay[dayKey] ?? [];
                if (tasks.length === 0 && posts.length === 0) return null;
                const date = new Date(dayKey + 'T12:00:00');
                return (
                  <div key={dayKey} className="border-b pb-4 last:border-0 last:pb-0">
                    <p className="font-semibold text-sm text-muted-foreground mb-2">
                      {date.toLocaleDateString(locale, dateOptions)}
                    </p>
                    <div className="space-y-2 pl-2">
                      {tasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-2 text-sm flex-wrap"
                        >
                          <ClipboardCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <Link
                            href={taskLink(t)}
                            className="font-medium hover:underline"
                          >
                            {t.title}
                          </Link>
                          {(t.campaignName || t.actionName) && (
                            <span className="text-muted-foreground">
                              — {[t.campaignName, t.actionName].filter(Boolean).join(' / ')}
                            </span>
                          )}
                          <span className="text-muted-foreground">
                            Отв.: {t.responsiblePerson}
                          </span>
                          <StatusBadge status={t.status} />
                        </div>
                      ))}
                      {posts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2 text-sm flex-wrap"
                        >
                          <Share2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <Link
                            href={postLink(p)}
                            className="font-medium hover:underline"
                          >
                            {p.title}
                          </Link>
                          {p.campaignName && (
                            <span className="text-muted-foreground">
                              — {p.campaignName}
                              {p.actionName ? ` / ${p.actionName}` : ''}
                            </span>
                          )}
                          {p.platforms?.length > 0 && (
                            <span className="text-muted-foreground">
                              {p.platforms.join(', ')}
                            </span>
                          )}
                          <StatusBadge status={p.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {weekDays.every(
                (d) =>
                  (weekTasksByDay[d]?.length ?? 0) === 0 &&
                  (weekPostsByDay[d]?.length ?? 0) === 0
              ) && (
                <p className="text-sm text-muted-foreground py-4">
                  Нет плановых задач и публикаций на ближайшую неделю.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="group-bg-2 border-l-4 border-l-[hsl(30_12%_85%)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5" />
              План на месяц
            </CardTitle>
            <CardDescription>
              Плановые задачи и запланированные публикации на ближайшие 30 дней.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {monthDays.map((dayKey) => {
                const tasks = monthTasksByDay[dayKey] ?? [];
                const posts = monthPostsByDay[dayKey] ?? [];
                if (tasks.length === 0 && posts.length === 0) return null;
                const date = new Date(dayKey + 'T12:00:00');
                return (
                  <div key={dayKey} className="border-b pb-4 last:border-0 last:pb-0">
                    <p className="font-semibold text-sm text-muted-foreground mb-2">
                      {date.toLocaleDateString(locale, dateOptions)}
                    </p>
                    <div className="space-y-2 pl-2">
                      {tasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-2 text-sm flex-wrap"
                        >
                          <ClipboardCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <Link
                            href={taskLink(t)}
                            className="font-medium hover:underline"
                          >
                            {t.title}
                          </Link>
                          {(t.campaignName || t.actionName) && (
                            <span className="text-muted-foreground">
                              — {[t.campaignName, t.actionName].filter(Boolean).join(' / ')}
                            </span>
                          )}
                          <span className="text-muted-foreground">
                            Отв.: {t.responsiblePerson}
                          </span>
                          <StatusBadge status={t.status} />
                        </div>
                      ))}
                      {posts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2 text-sm flex-wrap"
                        >
                          <Share2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <Link
                            href={postLink(p)}
                            className="font-medium hover:underline"
                          >
                            {p.title}
                          </Link>
                          {p.campaignName && (
                            <span className="text-muted-foreground">
                              — {p.campaignName}
                              {p.actionName ? ` / ${p.actionName}` : ''}
                            </span>
                          )}
                          {p.platforms?.length > 0 && (
                            <span className="text-muted-foreground">
                              {p.platforms.join(', ')}
                            </span>
                          )}
                          <StatusBadge status={p.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {monthDays.every(
                (d) =>
                  (monthTasksByDay[d]?.length ?? 0) === 0 &&
                  (monthPostsByDay[d]?.length ?? 0) === 0
              ) && (
                <p className="text-sm text-muted-foreground py-4">
                  Нет плановых задач и публикаций на ближайший месяц.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <PlanGanttSection />
      </div>
    </div>
  );
}
