

import { notFound } from 'next/navigation';
import { getCampaignById } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import { Calendar as CalendarIcon, Target, Users, Landmark, ArrowRight, TrendingUp, CalendarDays, LocateFixed, History, Ruble, Edit } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { NewActivityButton } from './new-activity-button';
import { EditActivityButton } from './edit-activity-button';
import { DeleteActivityButton } from './delete-activity-button';
import type { KPI } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UpdateMetricsForm } from './update-metrics-form';
import { GeneralExpensesList } from './general-expenses-list';
import { UpdateActionSummaryKpisForm } from './update-action-summary-kpis';
import { ActionEffectivenessCard } from './action-effectiveness-card';
import { UpdateActionStatus } from './update-action-status';
import { ActionResponsibilityCard } from './action-responsibility-card';
import { ActionPageHeaderActions } from './action-page-header-actions';
import { EditActionButton } from './edit-action-button';

type ActionDetailPageProps = {
  params: {
    id: string;
    actionId: string;
  };
};

export default async function ActionDetailPage({ params: paramsPromise }: ActionDetailPageProps) {
  const params = await paramsPromise;
  const campaign = await getCampaignById(params.id);
  const action = campaign?.actions.find((a) => a.id === params.actionId);

  if (!campaign || !action) {
    notFound();
  }

  const locale = 'ru-RU';
  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const currencyOptions = { style: 'currency', currency: 'RUB', minimumFractionDigits: 2, maximumFractionDigits: 2 };
  const shortCurrencyOptions = { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 };


  const aggregatedKpis: Record<string, { current: number; target: number; }> = {};

  (action.activities || []).forEach(activity => {
    (activity.kpis || []).forEach(kpi => {
      // Only include KPIs that are marked to be included in action goals
      if (kpi.includeInActionGoals === false) {
        return;
      }
      
      if (aggregatedKpis[kpi.name]) {
        aggregatedKpis[kpi.name].current += kpi.current;
        aggregatedKpis[kpi.name].target += kpi.target;
      } else {
        aggregatedKpis[kpi.name] = {
          current: kpi.current,
          target: kpi.target,
        };
      }
    });
  });

  const aggregatedKpisArray = Object.entries(aggregatedKpis).map(([name, data]) => ({
    name,
    ...data,
  }));

  const totalBudget = action.activities?.reduce((sum, activity) => sum + (activity.budget || 0), 0) || 0;
  const totalSpent = (action.activities?.reduce((sum, activity) => sum + (activity.spent || 0), 0) || 0) + (action.generalExpenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0);
  const budgetProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  
  const startDate = new Date(action.startDate);
  const endDate = new Date(action.endDate);
  const today = new Date();
  const totalDuration = Math.max(1, endDate.getTime() - startDate.getTime());
  const elapsedDuration = Math.max(0, today.getTime() - startDate.getTime());
  let durationProgress = Math.min(100, (elapsedDuration / totalDuration) * 100);


  return (
    <div>
      <PageHeader title={action.name} description={`Акция в рамках кампании: ${campaign.name}`}>
        <ActionPageHeaderActions action={action} campaign={campaign} />
      </PageHeader>

      <div className="grid gap-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Информация об акции</CardTitle>
            <EditActionButton action={action} campaignId={campaign.id} />
          </CardHeader>
          <CardContent>
             <div className="grid md:grid-cols-3 gap-6 text-sm mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md">
                        <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-muted-foreground">Длительность</p>
                        <p className="font-semibold text-lg">{startDate.toLocaleDateString(locale, dateOptions)} - {endDate.toLocaleDateString(locale, dateOptions)}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md">
                        <Target className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-muted-foreground">Статус</p>
                        <div className="font-semibold text-lg">
                          <UpdateActionStatus action={action} campaignId={campaign.id} />
                        </div>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md">
                        <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-muted-foreground">Целевая аудитория</p>
                        <div className="font-semibold text-lg">{action.targetAudience || 'Не указана'}</div>
                    </div>
                </div>
            </div>
            
            <Separator className="my-6" />

             <div>
                <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-muted-foreground flex items-center"><CalendarDays className="w-4 h-4 mr-1.5"/>Прогресс акции</span>
                    <span className="font-medium">{Math.round(durationProgress)}%</span>
                </div>
                <Progress value={durationProgress} className="h-2" />
            </div>

            {action.description && (
                <>
                    <Separator className="my-6" />
                    <div>
                        <h4 className="font-semibold mb-2">Описание</h4>
                        <p className="text-muted-foreground">{action.description}</p>
                    </div>
                </>
            )}
          </CardContent>
        </Card>

        <ActionResponsibilityCard action={action} campaignId={campaign.id} />

        <ActionEffectivenessCard action={action} campaignId={campaign.id} locale={locale} currencyOptions={currencyOptions} totalSpent={totalSpent} />
        
        <Card>
          <CardHeader>
              <CardTitle>Бюджет акции</CardTitle>
              <CardDescription>
                  Общий запланированный бюджет и фактические расходы по всем активностям.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="space-y-2">
                  <div className="flex justify-between items-end">
                      <span className="text-4xl font-bold">{new Intl.NumberFormat(locale, shortCurrencyOptions).format(totalSpent)}</span>
                      <span className="text-muted-foreground">/ {new Intl.NumberFormat(locale, shortCurrencyOptions).format(totalBudget)}</span>
                  </div>
                  <Progress value={budgetProgress} indicatorClassName={budgetProgress > 100 ? 'bg-destructive' : 'bg-primary'} />
                  <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Потрачено</span>
                      <span>Запланировано</span>
                  </div>
              </div>
          </CardContent>
        </Card>

        <GeneralExpensesList action={action} campaignId={campaign.id} />

        <Card>
            <CardHeader>
                <CardTitle>Общие цели акции</CardTitle>
                <CardDescription>Суммарный прогресс по всем KPI из активностей. Отметьте, какие KPI показывать на карточке акции.</CardDescription>
            </CardHeader>
            <CardContent>
                {aggregatedKpisArray.length > 0 ? (
                    <UpdateActionSummaryKpisForm 
                        kpis={aggregatedKpisArray}
                        action={action}
                        campaignId={campaign.id}
                        locale={locale}
                    />
                    ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">KPI для этой акции еще не определены в активностях.</p>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Активности</CardTitle>
                    <CardDescription>Список задач и мероприятий в рамках данной акции.</CardDescription>
                </div>
                <NewActivityButton campaignId={campaign.id} actionId={action.id} />
            </CardHeader>
            <CardContent>
                 {action.activities && action.activities.length > 0 ? (
                    <div className="grid lg:grid-cols-2 gap-6 items-start">
                        {action.activities.map(activity => {
                            const kpis = activity.kpis || [];
                            const footerKpis = kpis.filter(kpi => {
                                const parentKpi = kpis.find(p => p.id === kpi.parentId);
                                const conversion = parentKpi && parentKpi.current > 0 && kpi.current > 0 ? (kpi.current / parentKpi.current) * 100 : null;
                                const costPerUnit = kpi.current > 0 && activity.spent > 0 ? (activity.spent / kpi.current) * (kpi.multiplicity || 1) : null;
                                return conversion !== null || costPerUnit !== null;
                            });

                            return (
                             <Card key={activity.id} className="h-full flex flex-col">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{activity.name}</CardTitle>
                                            {activity.description && <CardDescription className="mt-1">{activity.description}</CardDescription>}
                                        </div>
                                        <div className="flex items-center ml-4">
                                            <EditActivityButton activity={activity} campaignId={campaign.id} actionId={action.id} />
                                            <DeleteActivityButton activityId={activity.id} campaignId={campaign.id} actionId={action.id} />
                                        </div>
                                    </div>
                                    {activity.trackingMethod && (
                                        <div className="flex items-center text-xs text-muted-foreground pt-2 gap-2">
                                            <LocateFixed className="w-3.5 h-3.5" />
                                            <span>{activity.trackingMethod}</span>
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground flex-1">
                                    <UpdateMetricsForm activity={activity} campaignId={campaign.id} actionId={action.id} />
                                </CardContent>
                                {footerKpis.length > 0 && (
                                    <CardFooter className="flex-col items-start gap-2 pt-4 border-t">
                                        {footerKpis.map(kpi => {
                                            const parentKpi = kpis.find(p => p.id === kpi.parentId);
                                            const conversion = parentKpi && parentKpi.current > 0 && kpi.current > 0 ? (kpi.current / parentKpi.current) * 100 : null;
                                            const costPerUnit = kpi.current > 0 && activity.spent > 0 ? (activity.spent / kpi.current) * (kpi.multiplicity || 1) : null;

                                            return (
                                                <div key={`footer-${kpi.id}`} className="flex items-center gap-4 text-xs">
                                                    <p className="font-medium text-foreground w-24 truncate">
                                                        {kpi.name}{kpi.multiplicity && kpi.multiplicity > 1 ? ` (${kpi.multiplicity})` : ''}:
                                                    </p>
                                                    {conversion !== null && parentKpi && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                            <TooltipTrigger className="flex items-center gap-1">
                                                                <TrendingUp className="w-4 h-4 text-green-500"/> 
                                                                <span className="font-bold text-green-500">{conversion.toFixed(1)}%</span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>CR из "{parentKpi.name}" (факт)</p>
                                                            </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                    {costPerUnit !== null && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger className="flex items-center gap-1">
                                                                    <span className="font-bold text-blue-500">{new Intl.NumberFormat(locale, currencyOptions).format(costPerUnit)} р.</span>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                <p>Стоимость за {kpi.multiplicity || 1} ед. (факт)</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </CardFooter>
                                )}
                            </Card>
                        )})}
                    </div>
                 ) : (
                     <div className="text-center text-sm text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                        <p>Активности еще не добавлены.</p>
                    </div>
                 )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
