
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Eye, FilePlus, Landmark, TrendingUp, CalendarDays } from 'lucide-react';
import { CampaignFilter } from './campaign-filter';
import { StatusFilter } from './status-filter';
import { DateFilter } from './date-filter';
import type { ActionStatus, Campaign, EnrichedAction } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewModeToggle } from '@/app/tasks/view-mode-toggle';

export function ActionsList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [actions, setActions] = useState<EnrichedAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [today, setToday] = useState(new Date());
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'grid';

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
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      let filteredActions = allActions;

      if (campaignId) {
        filteredActions = filteredActions.filter((action) => action.campaignId === campaignId);
      }
      if (status) {
          filteredActions = filteredActions.filter((action) => action.status === status);
      }
      if (startDate) {
        filteredActions = filteredActions.filter((action) => new Date(action.startDate) >= new Date(startDate));
      }
      if (endDate) {
        filteredActions = filteredActions.filter((action) => new Date(action.endDate) <= new Date(endDate));
      }
      
      setActions(filteredActions);
      setToday(new Date()); // Set date on client
      setIsLoading(false);
    }
    fetchData();
  }, [searchParams]);

  const locale = 'ru-RU';
  const currencyOptions = { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 };


  const renderGrid = () => (
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
                                    <span className="text-accent">{new Intl.NumberFormat(locale, currencyOptions).format(actualRevenue)}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-muted-foreground flex items-center"><Landmark className="w-3 h-3 mr-1.5"/>Прибыль</span>
                                 <div className="font-medium">
                                    <span className="text-accent">{new Intl.NumberFormat(locale, currencyOptions).format(actualProfit)}</span>
                                    <span className="text-muted-foreground text-xs"> / {new Intl.NumberFormat(locale, currencyOptions).format(action.plannedProfit || 0)}</span>
                                </div>
                            </div>
                        </div>
                        {plannedBudget > 0 && (
                            <div>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="text-muted-foreground flex items-center"><Landmark className="w-3 h-3 mr-1.5"/>Бюджет</span>
                                    <span className="font-medium">
                                        {new Intl.NumberFormat(locale, currencyOptions).format(totalSpent)} / {new Intl.NumberFormat(locale, currencyOptions).format(plannedBudget)}
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
  );

  const renderTable = () => (
     <Card>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Название акции</TableHead>
                    <TableHead>Кампания</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Период</TableHead>
                    <TableHead className="text-right">Бюджет (потрачено)</TableHead>
                    <TableHead className="text-right">Прибыль</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {actions.map((action) => {
                    const plannedBudget = action.activities?.reduce((sum, activity) => sum + activity.budget, 0) || 0;
                    const totalSpent = (action.activities?.reduce((sum, activity) => sum + activity.spent, 0) || 0) + (action.generalExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0);
                    
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

                    return (
                        <TableRow key={action.id}>
                            <TableCell className="font-medium">
                                <Link href={`/campaigns/${action.campaignId}/${action.id}`} className="hover:underline">
                                    {action.name}
                                </Link>
                            </TableCell>
                            <TableCell>{action.campaignName}</TableCell>
                            <TableCell><StatusBadge status={action.status} /></TableCell>
                            <TableCell>
                                {new Date(action.startDate).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' })} - {new Date(action.endDate).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' })}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                                {new Intl.NumberFormat(locale, currencyOptions).format(totalSpent)} / {new Intl.NumberFormat(locale, currencyOptions).format(plannedBudget)}
                            </TableCell>
                             <TableCell className="text-right font-mono text-accent">
                                {new Intl.NumberFormat(locale, currencyOptions).format(actualProfit)}
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
     </Card>
  );

  if (isLoading) {
    return (
        <div>
            <PageHeader title="Все акции" description="Просматривайте и управляйте всеми акциями в одном месте." />
            <div className="mb-8 p-4 border rounded-lg bg-card shadow-sm flex flex-wrap items-end gap-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-64" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <Skeleton className="h-10 w-10" />
            </div>
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
      />

      <div className="mb-8 p-4 border rounded-lg bg-card shadow-sm flex flex-wrap items-end gap-4">
            <CampaignFilter campaigns={campaigns} />
            <StatusFilter />
            <DateFilter />
            <div className="ml-auto">
              <ViewModeToggle />
            </div>
      </div>

      {view === 'grid' ? renderGrid() : renderTable()}

      {actions.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-sm text-muted-foreground">
              <FilePlus className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              {searchParams.has('campaignId') || searchParams.has('status') || searchParams.has('startDate') || searchParams.has('endDate')
                ? 'Нет акций, соответствующих вашим фильтрам.'
                : 'Акции еще не созданы.'}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
