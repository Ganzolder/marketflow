

import { notFound } from 'next/navigation';
import { getCampaignById } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Target, FilePlus, Eye, TrendingUp, Landmark, CalendarDays, ShoppingCart, PiggyBank, BarChart, Archive, ArchiveRestore } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import { NewActionButton } from './new-action-button';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { UpdateCampaignStatus } from '../update-campaign-status';
import { EditCampaignButton } from '../edit-campaign-button';
import { EditActionButton } from './[actionId]/edit-action-button';


type CampaignDetailPageProps = {
    params: { id: string };
    searchParams: { startDate?: string; endDate?: string; }
};

export default async function CampaignDetailPage({ params: paramsPromise, searchParams: searchParamsPromise }: CampaignDetailPageProps) {
  const params = await paramsPromise;
  const searchParams = await searchParamsPromise;
  const { id } = params;

  const campaign = await getCampaignById(id);

  if (!campaign) {
    notFound();
  }

  const startDateFilter = searchParams.startDate || '';
  const endDateFilter = searchParams.endDate || '';

  const actionsToFilter = campaign.actions || [];
  const filteredActions = actionsToFilter.filter(action => {
      const actionStartDate = new Date(action.startDate);
      const actionEndDate = new Date(action.endDate);
      const filterStartDate = startDateFilter ? new Date(startDateFilter) : null;
      const filterEndDate = endDateFilter ? new Date(endDateFilter) : null;

      if (filterStartDate && actionStartDate < filterStartDate) {
          return false;
      }
      if (filterEndDate && actionEndDate > filterEndDate) {
          return false;
      }
      return true;
  });

  const today = new Date();
  const locale = 'ru-RU';
  const currencyOptions = { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 };
  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

  const campaignStartDate = new Date(campaign.startDate);
  const campaignEndDate = new Date(campaign.endDate);
  const totalCampaignDuration = Math.max(1, campaignEndDate.getTime() - campaignStartDate.getTime());
  const elapsedCampaignDuration = Math.max(0, today.getTime() - campaignStartDate.getTime());
  let campaignDurationProgress = Math.min(100, (elapsedCampaignDuration / totalCampaignDuration) * 100);

  return (
    <div>
      <PageHeader title={campaign.name}>
        <EditCampaignButton campaign={campaign} />
      </PageHeader>

      <div className="grid gap-8">
        <Card>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md">
                        <Landmark className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-muted-foreground">Бюджет</p>
                        <p className="font-semibold text-lg">{new Intl.NumberFormat(locale, currencyOptions).format(campaign.budget)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md">
                        <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-muted-foreground">Длительность</p>
                        <p className="font-semibold text-lg">{campaignStartDate.toLocaleDateString(locale, dateOptions)} - {campaignEndDate.toLocaleDateString(locale, dateOptions)}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md">
                        <Target className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-muted-foreground">Статус</p>
                        <div className="font-semibold text-lg"><UpdateCampaignStatus campaign={campaign} /></div>
                    </div>
                </div>
            </div>
            <Separator className="my-6" />
            <div>
                <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-muted-foreground flex items-center"><CalendarDays className="w-4 h-4 mr-1.5"/>Прогресс кампании</span>
                    <span className="font-medium">{Math.round(campaignDurationProgress)}%</span>
                </div>
                <Progress value={campaignDurationProgress} className="h-2" />
            </div>
            <Separator className="my-6" />
            <p className="text-muted-foreground">{campaign.description}</p>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Акции</CardTitle>
                    <NewActionButton campaignId={campaign.id} />
                </div>
                <CardDescription>Список всех акций, связанных с этой кампанией.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                    {filteredActions.map(action => {
                        const allKpis = action.activities?.flatMap(a => a.kpis?.filter(k => k.includeInActionGoals !== false) || []) || [];
                        const summaryKpis: Record<string, { current: number, target: number }> = {};
                        
                        // Aggregate KPIs
                        allKpis.forEach(kpi => {
                            if (summaryKpis[kpi.name]) {
                                summaryKpis[kpi.name].current += kpi.current;
                                summaryKpis[kpi.name].target += kpi.target;
                            } else {
                                summaryKpis[kpi.name] = { current: kpi.current, target: kpi.target };
                            }
                        });

                        const summaryKpisToShow = Object.entries(summaryKpis)
                            .filter(([name]) => action.summaryKpis?.includes(name))
                            .map(([name, data]) => ({ name, ...data }));

                        const plannedBudget = action.activities?.reduce((sum, activity) => sum + activity.budget, 0) || 0;
                        const totalSpent = (action.activities?.reduce((sum, activity) => sum + activity.spent, 0) || 0) + (action.generalExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0);
                        const budgetProgress = plannedBudget > 0 ? (totalSpent / plannedBudget) * 100 : 0;
                        
                        const salesKpiName = "Продажи";
                        let plannedSales = 0;
                        let actualSales = 0;

                        action.activities?.forEach(activity => {
                            activity.kpis?.forEach(kpi => {
                                if (kpi.name === salesKpiName) {
                                    plannedSales += kpi.target;
                                    actualSales += kpi.current;
                                }
                            });
                        });

                        const plannedRevenue = plannedSales * (action.plannedAverageCheck || 0);
                        const actualRevenue = actualSales * (action.actualAverageCheck || 0);
                        const plannedProfit = plannedRevenue * ((action.plannedMarginality || 0) / 100);
                        const actualProfit = actualRevenue * ((action.actualMarginality || 0) / 100);
                        const hasRevenueData = action.plannedAverageCheck || action.actualAverageCheck;
                        const hasProfitData = action.actualMarginality || action.plannedMarginality;

                        const startDate = new Date(action.startDate);
                        const endDate = new Date(action.endDate);
                        const totalDuration = Math.max(1, endDate.getTime() - startDate.getTime());
                        const elapsedDuration = Math.max(0, today.getTime() - startDate.getTime());
                        let durationProgress = Math.min(100, (elapsedDuration / totalDuration) * 100);

                        return (
                        <Link key={action.id} href={`/campaigns/${campaign.id}/${action.id}`} className="block hover:shadow-lg transition-shadow rounded-lg">
                            <Card className="h-full flex flex-col">
                                <CardHeader>
                                    <CardTitle className="text-lg flex justify-between items-start">
                                        <span>{action.name}</span>
                                        <EditActionButton action={action} campaignId={campaign.id} />
                                    </CardTitle>
                                    <CardDescription>{action.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <div className="space-y-4">
                                        {summaryKpisToShow.length > 0 && (
                                            <div className="space-y-3">
                                                {summaryKpisToShow.map(kpi => (
                                                    <div key={kpi.name}>
                                                        <div className="flex justify-between items-center text-sm mb-1">
                                                          <span className="text-muted-foreground flex items-center"><Eye className="w-3 h-3 mr-1.5"/>{kpi.name}</span>
                                                          <span className="font-medium">{kpi.target > 0 ? Math.round((kpi.current / kpi.target) * 100) : 0}%</span>
                                                        </div>
                                                        <Progress value={kpi.target > 0 ? (kpi.current / kpi.target) * 100 : 0} className="h-2" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {(summaryKpisToShow.length > 0 || plannedBudget > 0 || hasRevenueData) && <Separator />}

                                        <div className="space-y-3">
                                            {hasRevenueData && (
                                                <div>
                                                    <div className="flex justify-between items-center text-sm mb-1">
                                                        <span className="text-muted-foreground flex items-center"><TrendingUp className="w-3 h-3 mr-1.5"/>Выручка</span>
                                                        <span className="font-medium text-accent">
                                                            {new Intl.NumberFormat(locale, { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(actualRevenue)} / <span className="text-muted-foreground">{new Intl.NumberFormat(locale, { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(plannedRevenue)}</span>
                                                        </span>
                                                    </div>
                                                    <Progress value={plannedRevenue > 0 ? (actualRevenue / plannedRevenue) * 100 : 0} className="h-2" indicatorClassName="bg-accent" />
                                                </div>
                                            )}
                                            {hasProfitData && (
                                                <div>
                                                    <div className="flex justify-between items-center text-sm mb-1">
                                                        <span className="text-muted-foreground flex items-center"><Landmark className="w-3 h-3 mr-1.5"/>Прибыль</span>
                                                        <span className="font-medium text-accent">
                                                            {new Intl.NumberFormat(locale, { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(actualProfit)} / <span className="text-muted-foreground">{new Intl.NumberFormat(locale, { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(plannedProfit)}</span>
                                                        </span>
                                                    </div>
                                                    <Progress value={plannedProfit > 0 ? (actualProfit / plannedProfit) * 100 : 0} className="h-2" indicatorClassName="bg-accent" />
                                                </div>
                                            )}
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
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <div className="flex justify-between items-center text-sm mb-1">
                                                    <span className="text-muted-foreground flex items-center"><CalendarDays className="w-3 h-3 mr-1.5"/>Прогресс акции</span>
                                                    <span className="font-medium">{Math.round(durationProgress)}%</span>
                                                </div>
                                                <Progress value={durationProgress} className="h-2" />
                                            </div>
                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <StatusBadge status={action.status} />
                                                <span>{startDate.toLocaleDateString(locale, {month: 'short', day: 'numeric'})} - {endDate.toLocaleDateString(locale, {month: 'short', day: 'numeric'})}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    )})}
                </div>
                 {filteredActions.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-10">
                            <FilePlus className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                            <div>
                                {campaign.actions.length > 0 ? 'Нет акций, соответствующих фильтру.' : 'Акции еще не добавлены.'}
                            </div>
                        </div>
                    )}
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
