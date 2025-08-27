

"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { getAllActions, getCampaigns } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Eye, FilePlus, Landmark, TrendingUp, CalendarDays } from 'lucide-react';
import { CampaignFilter } from './campaign-filter';
import { StatusFilter } from './status-filter';
import type { ActionStatus, Campaign, EnrichedAction } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export function ActionsList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [actions, setActions] = useState<EnrichedAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [today, setToday] = useState(new Date());
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [allCampaigns, allActions] = await Promise.all([
        getCampaigns(),
        getAllActions(),
      ]);
      setCampaigns(allCampaigns);
      
      const campaignId = searchParams.get('campaignId');
      const status = searchParams.get('status') as ActionStatus | null;

      let filteredActions = allActions;
      if (campaignId) {
        filteredActions = filteredActions.filter((action) => action.campaignId === campaignId);
      }
      if (status) {
          filteredActions = filteredActions.filter((action) => action.status === status);
      }
      
      setActions(filteredActions);
      setToday(new Date()); // Set date on client
      setIsLoading(false);
    }
    fetchData();
  }, [searchParams]);

  const locale = 'ru-RU';

  if (isLoading) {
    return (
        <div>
            <PageHeader title="Все акции" description="Просматривайте и управляйте всеми акциями в одном месте.">
                 <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <Skeleton className="h-10 w-full md:w-64" />
                    <Skeleton className="h-10 w-full md:w-64" />
                </div>
            </PageHeader>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Все акции"
        description="Просматривайте и управляйте всеми акциями в одном месте."
      >
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <CampaignFilter campaigns={campaigns} />
            <StatusFilter />
        </div>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => {
          const allKpis =
            action.activities?.flatMap(
              (a) => a.kpis?.filter((k) => k.includeInActionGoals !== false) || []
            ) || [];
          const summaryKpis: Record<string, { current: number; target: number }> =
            {};

          allKpis.forEach((kpi) => {
            if (summaryKpis[kpi.name]) {
              summaryKpis[kpi.name].current += kpi.current;
              summaryKpis[kpi.name].target += kpi.target;
            } else {
              summaryKpis[kpi.name] = {
                current: kpi.current,
                target: kpi.target,
              };
            }
          });

          const summaryKpisToShow = Object.entries(summaryKpis)
            .filter(([name]) => action.summaryKpis?.includes(name))
            .map(([name, data]) => ({ name, ...data }));

          const plannedBudget = action.activities?.reduce((sum, activity) => sum + activity.budget, 0) || 0;
          const totalSpent = (action.activities?.reduce((sum, activity) => sum + activity.spent, 0) || 0) + (action.generalExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0);
          const budgetProgress = plannedBudget > 0 ? (totalSpent / plannedBudget) * 100 : 0;
          
          const salesKpiName = action.salesKpiName || "Продажи";
          let actualSales = 0;

          action.activities?.forEach(activity => {
              activity.kpis?.forEach(kpi => {
                  if (kpi.name === salesKpiName) {
                      actualSales += kpi.current;
                  }
              });
          });
          
          const actualRevenue = actualSales * (action.actualAverageCheck || 0);
          const actualGrossProfit = actualRevenue * ((action.actualMarginality || 0) / 100);
          const actualProfit = actualGrossProfit - totalSpent;

          const startDate = new Date(action.startDate);
          const endDate = new Date(action.endDate);
          const totalDuration = Math.max(1, endDate.getTime() - startDate.getTime());
          const elapsedDuration = Math.max(0, today.getTime() - startDate.getTime());
          let durationProgress = Math.min(100, (elapsedDuration / totalDuration) * 100);

          return (
            <Link
              key={action.id}
              href={`/campaigns/${action.campaignId}/${action.id}`}
              className="block hover:shadow-lg transition-shadow rounded-lg"
            >
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg flex justify-between items-start">
                    <span>{action.name}</span>
                  </CardTitle>
                  <CardDescription>
                    Кампания: {action.campaignName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="space-y-4">
                    {summaryKpisToShow.length > 0 && (
                      <div className="space-y-3">
                        {summaryKpisToShow.map((kpi) => (
                          <div key={kpi.name}>
                            <div className="flex justify-between items-center text-sm mb-1">
                              <span className="text-muted-foreground flex items-center">
                                <Eye className="w-3 h-3 mr-1.5" />
                                {kpi.name}
                              </span>
                              <span className="font-medium">
                                {kpi.target > 0
                                  ? Math.round(
                                      (kpi.current / kpi.target) * 100
                                    )
                                  : 0}
                                %
                              </span>
                            </div>
                            <Progress
                              value={
                                kpi.target > 0
                                  ? (kpi.current / kpi.target) * 100
                                  : 0
                              }
                              className="h-2"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {(summaryKpisToShow.length > 0 || plannedBudget > 0) && <Separator />}

                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-muted-foreground flex items-center"><TrendingUp className="w-3 h-3 mr-1.5"/>Выручка</span>
                                <div className="font-medium">
                                    <span className="text-accent">{new Intl.NumberFormat(locale, { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(actualRevenue)}</span>
                                    {action.plannedRevenue ? (
                                        <span className="text-muted-foreground text-xs"> / {new Intl.NumberFormat(locale, { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(action.plannedRevenue)}</span>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-muted-foreground flex items-center"><Landmark className="w-3 h-3 mr-1.5"/>Прибыль</span>
                                 <div className="font-medium">
                                    <span className="text-accent">{new Intl.NumberFormat(locale, { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(actualProfit)}</span>
                                    {action.plannedProfit ? (
                                        <span className="text-muted-foreground text-xs"> / {new Intl.NumberFormat(locale, { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(action.plannedProfit)}</span>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                        {plannedBudget > 0 && (
                            <div>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="text-muted-foreground flex items-center"><Landmark className="w-3 h-3 mr-1.5"/>Бюджет</span>
                                    <span className="font-medium">
                                        {new Intl.NumberFormat(locale, { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(totalSpent)} / {new Intl.NumberFormat(locale, { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(plannedBudget)}
                                    </span>
                                </div>
                                <Progress value={budgetProgress} className="h-2" indicatorClassName={budgetProgress > 100 ? 'bg-destructive' : ''} />
                            </div>
                        )}
                         <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-muted-foreground flex items-center"><CalendarDays className="w-3 h-3 mr-1.5"/>Прогресс акции</span>
                                <span className="font-medium">{Math.round(durationProgress)}%</span>
                            </div>
                            <Progress value={durationProgress} className="h-2" />
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
                      <StatusBadge status={action.status} />
                      <span>
                        {new Date(action.startDate).toLocaleDateString(locale, {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        -{' '}
                        {new Date(action.endDate).toLocaleDateString(locale, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      {actions.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-sm text-muted-foreground">
              <FilePlus className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              {searchParams.has('campaignId') || searchParams.has('status')
                ? 'Нет акций, соответствующих вашим фильтрам.'
                : 'Акции еще не созданы.'}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
