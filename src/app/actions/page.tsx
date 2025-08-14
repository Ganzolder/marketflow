
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
import { Eye, FilePlus, DollarSign, TrendingUp, Landmark } from 'lucide-react';
import { CampaignFilter } from './campaign-filter';
import { StatusFilter } from './status-filter';
import type { ActionStatus } from '@/lib/types';

type ActionsPageProps = {
  searchParams: {
    campaignId?: string;
    status?: ActionStatus;
  };
};

export default async function ActionsPage({ searchParams: searchParamsPromise }: ActionsPageProps) {
  const searchParams = await searchParamsPromise;
  const allCampaigns = await getCampaigns();
  const allActions = await getAllActions();
  const selectedCampaignId = searchParams.campaignId;
  const selectedStatus = searchParams.status;

  let filteredActions = allActions;

  if (selectedCampaignId) {
    filteredActions = filteredActions.filter((action) => action.campaignId === selectedCampaignId);
  }

  if (selectedStatus) {
      filteredActions = filteredActions.filter((action) => action.status === selectedStatus);
  }

  const locale = 'ru-RU';

  return (
    <div>
      <PageHeader
        title="Все акции"
        description="Просматривайте и управляйте всеми акциями в одном месте."
      >
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <CampaignFilter campaigns={allCampaigns} />
            <StatusFilter />
        </div>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredActions.map((action) => {
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
                    
                    {(summaryKpisToShow.length > 0 || plannedBudget > 0 || hasRevenueData) && <Separator />}

                    <div className="space-y-3">
                        {hasRevenueData && (
                            <div>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="text-muted-foreground flex items-center"><TrendingUp className="w-3 h-3 mr-1.5"/>Выручка</span>
                                    <span className="font-medium text-accent">
                                        {new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(actualRevenue)} / <span className="text-muted-foreground">{new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(plannedRevenue)}</span>
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
                                        {new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(actualProfit)} / <span className="text-muted-foreground">{new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(plannedProfit)}</span>
                                    </span>
                                </div>
                                <Progress value={plannedProfit > 0 ? (actualProfit / plannedProfit) * 100 : 0} className="h-2" indicatorClassName="bg-accent" />
                            </div>
                        )}
                        {plannedBudget > 0 && (
                            <div>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="text-muted-foreground flex items-center"><DollarSign className="w-3 h-3 mr-1.5"/>Бюджет</span>
                                    <span className="font-medium">
                                        {new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalSpent)} / {new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(plannedBudget)}
                                    </span>
                                </div>
                                <Progress value={budgetProgress} className="h-2" indicatorClassName={budgetProgress > 100 ? 'bg-destructive' : ''} />
                            </div>
                        )}
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
      {filteredActions.length === 0 && (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-sm text-muted-foreground">
              <FilePlus className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              {selectedCampaignId || selectedStatus
                ? 'Нет акций, соответствующих вашим фильтрам.'
                : 'Акции еще не созданы.'}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
