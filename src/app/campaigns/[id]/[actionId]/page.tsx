
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
} from "@/components/ui/tooltip"

type ActionDetailPageProps = {
  params: {
    id: string;
    actionId: string;
  };
};

export default async function ActionDetailPage({ params }: ActionDetailPageProps) {
  const campaign = await getCampaignById(params.id);
  const action = campaign?.actions.find((a) => a.id === params.actionId);

  if (!campaign || !action) {
    notFound();
  }

  const locale = 'ru-RU';
  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const currencyOptions = { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 };

  const renderKpiTree = (kpis: KPI[], parentId: string | null = null, budget: number, allKpis: KPI[]) => {
    const children = kpis.filter(kpi => kpi.parentId === parentId);
    if (children.length === 0) return null;

    return (
        <div className={`space-y-4 ${parentId !== null ? 'pl-6 border-l ml-2' : ''}`}>
            {children.map(kpi => {
                const parentKpi = allKpis.find(p => p.id === kpi.parentId);
                const conversion = parentKpi && parentKpi.target > 0 && kpi.target > 0 ? (kpi.target / parentKpi.target) * 100 : null;
                const costPerUnit = kpi.target > 0 && kpi.multiple > 0 ? budget / (kpi.target / kpi.multiple) : null;
                const multiple = kpi.multiple || 1;

                return (
                    <div key={kpi.id} className="relative">
                        {parentId !== null && <div className="absolute -left-6 top-2.5 h-px w-4 bg-border"></div>}
                        <Card className="bg-muted/30">
                            <CardContent className="p-3 text-sm">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold">{kpi.name}</p>
                                    <Badge variant="secondary">{kpi.target.toLocaleString(locale)} {kpi.unit}</Badge>
                                </div>
                                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-muted-foreground mt-2 text-xs">
                                   {conversion !== null && parentKpi && (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger className="flex items-center gap-1">
                                                <TrendingUp className="w-3.5 h-3.5 text-green-500"/> 
                                                <span className="font-medium text-green-500">{conversion.toFixed(1)}%</span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Конверсия из "{parentKpi.name}"</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                   )}
                                   {costPerUnit !== null && (
                                        <TooltipProvider>
                                           <Tooltip>
                                             <TooltipTrigger className="flex items-center gap-1">
                                                <CircleDollarSign className="w-3.5 h-3.5 text-blue-500" />
                                                <span className="font-medium text-blue-500">{new Intl.NumberFormat(locale, currencyOptions).format(costPerUnit)}</span>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Стоимость за {multiple.toLocaleString(locale)} {kpi.unit}</p>
                                              </TooltipContent>
                                           </Tooltip>
                                        </TooltipProvider>
                                   )}
                                </div>
                                {renderKpiTree(kpis, kpi.id, budget, allKpis)}
                            </CardContent>
                        </Card>
                    </div>
                )
            })}
        </div>
    )
  }


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

        <Card>
            <CardHeader>
                <CardTitle>Цели акции</CardTitle>
                <CardDescription>Отслеживание прогресса по ключевым показателям.</CardDescription>
            </CardHeader>
            <CardContent>
                {action.goals && action.goals.length > 0 ? (
                    <div className="space-y-4">
                    {action.goals.map(goal => (
                        <div key={goal.id}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">{goal.name}</span>
                                <span className="font-medium">{goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0}%</span>
                            </div>
                            <Progress value={goal.target > 0 ? (goal.current / goal.target) * 100 : 0} className="h-3" />
                            <p className="text-sm text-muted-foreground text-right mt-1">
                                {goal.current.toLocaleString(locale)} / {goal.target.toLocaleString(locale)} {goal.unit}
                            </p>
                        </div>
                    ))}
                    </div>
                    ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Цели для этой акции еще не определены.</p>
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
                        {action.activities.map(activity => (
                             <Card key={activity.id} className="h-full flex flex-col">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{activity.name}</CardTitle>
                                            {activity.description && <CardDescription>{activity.description}</CardDescription>}
                                        </div>
                                        <div className="flex items-center ml-4">
                                            <EditActivityButton activity={activity} campaignId={campaign.id} actionId={action.id} />
                                            <DeleteActivityButton activityId={activity.id} campaignId={campaign.id} actionId={action.id} />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground space-y-3 flex-1">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="w-4 h-4" />
                                            <span>{new Date(activity.startDate).toLocaleDateString(locale, {day: '2-digit', month: 'short'})} - {new Date(activity.endDate).toLocaleDateString(locale, {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4" />
                                            <span className="font-semibold">{new Intl.NumberFormat(locale, {style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0}).format(activity.budget)}</span>
                                        </div>
                                    </div>
                                    <div>
                                       <h4 className="font-medium text-foreground mb-2">KPI</h4>
                                       {activity.kpis && activity.kpis.length > 0 ? (
                                            renderKpiTree(activity.kpis, null, activity.budget, activity.kpis)
                                       ) : (
                                            <p className="text-xs text-center text-muted-foreground py-2">KPI не добавлены.</p>
                                       )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
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
