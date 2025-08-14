
import { getCampaignById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Edit, Calendar as CalendarIcon, DollarSign, Target, FilePlus, Eye, TrendingUp, Landmark } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import { NewActionButton } from './new-action-button';
import { EditActionButton } from './edit-action-button';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

type CampaignDetailPageProps = {
  params: {
    id: string;
  },
  searchParams: {
    startDate?: string;
    endDate?: string;
  }
}

export default async function CampaignDetailPage({ params: paramsPromise, searchParams: searchParamsPromise }: CampaignDetailPageProps) {
  const params = await paramsPromise;
  const searchParams = await searchParamsPromise;
  const campaign = await getCampaignById(params.id);

  if (!campaign) {
    notFound();
  }

  const startDateFilter = searchParams.startDate || '';
  const endDateFilter = searchParams.endDate || '';
  
  const filteredActions = (campaign.actions || []).filter(action => {
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

  const locale = 'ru-RU';
  const currencyOptions = { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 };
  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

  return (
    <div>
      <PageHeader title={campaign.name}>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Редактировать кампанию
        </Button>
      </PageHeader>

      <div className="grid gap-8">
        <Card>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
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
                        <p className="font-semibold text-lg">{new Date(campaign.startDate).toLocaleDateString(locale, dateOptions)} - {new Date(campaign.endDate).toLocaleDateString(locale, dateOptions)}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md">
                        <Target className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-muted-foreground">Статус</p>
                        <div className="font-semibold text-lg"><StatusBadge status={campaign.status} /></div>
                    </div>
                </div>
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
                {/* Note: Filtering will now be handled by page reloads with query params */}
                 {/*
                 <div className="grid md:grid-cols-2 gap-4 pt-4">
                    <div className="grid gap-2">
                      <Label htmlFor="start-date-filter">Начало акции после</Label>
                      <Input id="start-date-filter" type="date" value={startDateFilter} onChange={e => setStartDateFilter(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="end-date-filter">Окончание акции до</Label>
                      <Input id="end-date-filter" type="date" value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} />
                    </div>
                </div>
                */}
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
                        const actualProfit = actualRevenue * ((action.actualMarginality || 0) / 100);
                        const hasRevenueData = action.plannedAverageCheck || action.actualAverageCheck;
                        const hasProfitData = action.actualMarginality;


                        return (
                        <Link key={action.id} href={`/campaigns/${campaign.id}/${action.id}`} className="block hover:shadow-lg transition-shadow rounded-lg">
                            <Card className="h-full flex flex-col">
                                <CardHeader>
                                    <CardTitle className="text-lg flex justify-between items-start">
                                        <span>{action.name}</span>
                                        <EditActionButton action={action} campaignId={campaign.id}/>
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
                                            {hasRevenueData > 0 && (
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
                                            {hasProfitData > 0 && (
                                                <div>
                                                    <div className="flex justify-between items-center text-sm mb-1">
                                                        <span className="text-muted-foreground flex items-center"><Landmark className="w-3 h-3 mr-1.5"/>Прибыль</span>
                                                        <span className="font-medium text-accent">
                                                            {new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(actualProfit)}
                                                        </span>
                                                    </div>
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
                                            <span>{new Date(action.startDate).toLocaleDateString(locale, {month: 'short', day: 'numeric'})} - {new Date(action.endDate).toLocaleDateString(locale, {month: 'short', day: 'numeric'})}</span>
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
                             {campaign.actions.length > 0 ? 'Нет акций, соответствующих фильтру.' : 'Акции еще не добавлены.'}
                        </div>
                    )}
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
