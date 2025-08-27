

import { PageHeader } from '@/components/page-header';
import { getAllActivities, getCampaigns, getAllActions } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { FilePlus, Landmark, LocateFixed, CalendarDays, TrendingUp, BadgeRussianRuble } from 'lucide-react';
import { Filters } from './filters';
import type { EnrichedActivity } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

type ActivitiesPageProps = {
  searchParams: {
    campaignId?: string;
    actionId?: string;
    startDate?: string;
    endDate?: string;
  };
};

export default async function ActivitiesPage({ searchParams: searchParamsPromise }: ActivitiesPageProps) {
  const searchParams = await searchParamsPromise;
  const allCampaigns = await getCampaigns();
  const allActions = await getAllActions();
  const allActivities = await getAllActivities();

  const filteredActivities = allActivities.filter(activity => {
    if (searchParams.campaignId && activity.campaignId !== searchParams.campaignId) {
      return false;
    }
    if (searchParams.actionId && activity.actionId !== searchParams.actionId) {
        return false;
    }
    if (searchParams.startDate) {
        const activityStartDate = new Date(activity.startDate);
        const filterStartDate = new Date(searchParams.startDate);
        if (activityStartDate < filterStartDate) return false;
    }
    if (searchParams.endDate) {
        const activityEndDate = new Date(activity.endDate);
        const filterEndDate = new Date(searchParams.endDate);
        if (activityEndDate > filterEndDate) return false;
    }
    return true;
  });
  
  const locale = 'ru-RU';
  const currencyOptions = { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 };
  const today = new Date();

  return (
    <div>
      <PageHeader
        title="Все активности"
        description="Просматривайте и управляйте всеми активностями в одном месте."
      >
        <Filters campaigns={allCampaigns} allActions={allActions} />
      </PageHeader>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredActivities.map((activity) => {
            const budgetProgress = activity.budget > 0 ? (activity.spent / activity.budget) * 100 : 0;
            const startDate = new Date(activity.startDate);
            const endDate = new Date(activity.endDate);
            const totalDuration = Math.max(1, endDate.getTime() - startDate.getTime());
            const elapsedDuration = Math.max(0, today.getTime() - startDate.getTime());
            let durationProgress = Math.min(100, (elapsedDuration / totalDuration) * 100);

            const footerKpis = (activity.kpis || []).filter(kpi => {
                const parentKpi = (activity.kpis || []).find(p => p.id === kpi.parentId);
                const conversion = parentKpi && parentKpi.current > 0 && kpi.current > 0 ? (kpi.current / parentKpi.current) * 100 : null;
                const costPerUnit = kpi.current > 0 && activity.spent > 0 ? (activity.spent / kpi.current) * (kpi.multiplicity || 1) : null;
                return conversion !== null || costPerUnit !== null;
            });

            return (
                <Link
                key={activity.id}
                href={`/campaigns/${activity.campaignId}/${activity.actionId}`}
                className="block hover:shadow-lg transition-shadow rounded-lg"
                >
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg">{activity.name}</CardTitle>
                        <CardDescription>
                            Акция: <span className="font-medium text-foreground">{activity.actionName}</span>
                        </CardDescription>
                        <CardDescription>
                            Кампания: <span className="font-medium text-foreground">{activity.campaignName}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4 text-sm">
                        {activity.trackingMethod && (
                            <div className="flex items-center text-xs text-muted-foreground pt-2 gap-2">
                                <LocateFixed className="w-3.5 h-3.5" />
                                <span>{activity.trackingMethod}</span>
                            </div>
                        )}
                        {(activity.kpis || []).map(kpi => (
                            <div key={kpi.id}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-muted-foreground">{kpi.name}</span>
                                    <span className="font-medium">{kpi.target > 0 ? Math.round((kpi.current / kpi.target) * 100) : 0}%</span>
                                </div>
                                <Progress value={kpi.target > 0 ? (kpi.current / kpi.target) * 100 : 0} className="h-2" />
                            </div>
                        ))}
                         <Separator />
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-muted-foreground flex items-center"><BadgeRussianRuble className="w-4 h-4 mr-1.5"/>Бюджет</span>
                                    <span className="font-medium">
                                        {new Intl.NumberFormat(locale, currencyOptions).format(activity.spent)} / {new Intl.NumberFormat(locale, currencyOptions).format(activity.budget)}
                                    </span>
                                </div>
                                <Progress value={budgetProgress} className="h-2" indicatorClassName={budgetProgress > 100 ? 'bg-destructive' : ''} />
                            </div>
                             <div>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="text-muted-foreground flex items-center"><CalendarDays className="w-4 h-4 mr-1.5"/>Прогресс</span>
                                    <span className="font-medium">{Math.round(durationProgress)}%</span>
                                </div>
                                <Progress value={durationProgress} className="h-2" />
                            </div>
                        </div>
                    </CardContent>
                     <CardFooter className="flex-col items-start gap-2 pt-4 border-t">
                         <div className="flex items-center justify-between text-sm text-muted-foreground w-full">
                           <span>
                                {startDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                           </span>
                        </div>
                        {footerKpis.length > 0 && <Separator className="w-full" />}
                        {footerKpis.map(kpi => {
                            const parentKpi = (activity.kpis || []).find(p => p.id === kpi.parentId);
                            const conversion = parentKpi && parentKpi.current > 0 && kpi.current > 0 ? (kpi.current / parentKpi.current) * 100 : null;
                            const costPerUnit = kpi.current > 0 && activity.spent > 0 ? (activity.spent / kpi.current) * (kpi.multiplicity || 1) : null;

                            return (
                                <div key={`footer-${kpi.id}`} className="flex items-center gap-4 text-xs w-full">
                                    <p className="font-medium text-foreground w-24 truncate">
                                        {kpi.name}{kpi.multiplicity && kpi.multiplicity > 1 ? ` (${kpi.multiplicity})` : ''}:
                                    </p>
                                    {conversion !== null && parentKpi && (
                                        <Badge variant="outline" className="font-mono text-green-600 border-green-200">
                                            <TrendingUp className="w-3 h-3 mr-1" />
                                            {conversion.toFixed(1)}% CR
                                        </Badge>
                                    )}
                                    {costPerUnit !== null && (
                                        <Badge variant="outline" className="font-mono text-blue-600 border-blue-200">
                                            {new Intl.NumberFormat(locale, { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(costPerUnit)}
                                        </Badge>
                                    )}
                                </div>
                            )
                        })}
                    </CardFooter>
                </Card>
                </Link>
            );
        })}
      </div>
      {filteredActivities.length === 0 && (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-sm text-muted-foreground">
              <FilePlus className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              {Object.keys(searchParams).length > 0
                ? 'Нет активностей, соответствующих вашим фильтрам.'
                : 'Активности еще не созданы.'}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
