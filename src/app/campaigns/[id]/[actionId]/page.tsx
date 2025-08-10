

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
