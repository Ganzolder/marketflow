
import { notFound } from 'next/navigation';
import { getCampaignById } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import { Calendar as CalendarIcon, Target, Users, DollarSign, ArrowRight, TrendingUp, CircleDollarSign } from 'lucide-react';
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
  const currencyOptions = { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 };

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


  return (
    <div>
      <PageHeader title={action.name} description={`Акция в рамках кампании: ${campaign.name}`} />

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Информация об акции</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="grid md:grid-cols-3 gap-6 text-sm mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md">
                        <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-muted-foreground">Длительность</p>
                        <p className="font-semibold text-lg">{new Date(action.startDate).toLocaleDateString(locale, dateOptions)} - {new Date(action.endDate).toLocaleDateString(locale, dateOptions)}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md">
                        <Target className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-muted-foreground">Статус</p>
                        <div className="font-semibold text-lg"><StatusBadge status={action.status} /></div>
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
            {action.description && (
                <>
                    <Separator className="my-4" />
                    <div>
                        <h4 className="font-semibold mb-2">Описание</h4>
                        <p className="text-muted-foreground">{action.description}</p>
                    </div>
                </>
            )}
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
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground flex-1">
                                    <UpdateMetricsForm activity={activity} campaignId={campaign.id} actionId={action.id} />
                                </CardContent>
                                <CardFooter className="flex-col items-start gap-2 pt-4 border-t">
                                     {kpis.map(kpi => {
                                        const parentKpi = kpis.find(p => p.id === kpi.parentId);
                                        // Conversion uses current values
                                        const conversion = parentKpi && parentKpi.current > 0 && kpi.current > 0 ? (kpi.current / parentKpi.current) * 100 : null;
                                        // Cost uses current SPENT vs current KPI value
                                        const costPerUnit = kpi.current > 0 && activity.spent > 0 ? activity.spent / kpi.current : null;
                                        
                                        if (conversion === null && costPerUnit === null) return null;

                                        return (
                                            <div key={`footer-${kpi.id}`} className="flex items-center gap-4 text-xs">
                                                <p className="font-medium text-foreground w-24 truncate">{kpi.name}:</p>
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
                                                            <CircleDollarSign className="w-4 h-4 text-blue-500" />
                                                            <span className="font-bold text-blue-500">{new Intl.NumberFormat(locale, currencyOptions).format(costPerUnit)}</span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                              <p>Стоимость за ед. (факт)</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                        )
                                     })}
                                </CardFooter>
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
