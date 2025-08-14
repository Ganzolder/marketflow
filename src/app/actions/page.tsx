
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Eye, FilePlus } from 'lucide-react';
import { CampaignFilter } from './campaign-filter';

type ActionsPageProps = {
  searchParams: {
    campaignId?: string;
  };
};

export default async function ActionsPage({ searchParams }: ActionsPageProps) {
  const allCampaigns = await getCampaigns();
  const allActions = await getAllActions();
  const selectedCampaignId = searchParams.campaignId;

  const filteredActions = selectedCampaignId
    ? allActions.filter((action) => action.campaignId === selectedCampaignId)
    : allActions;

  const locale = 'ru-RU';
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return (
    <div>
      <PageHeader
        title="Все акции"
        description="Просматривайте и управляйте всеми акциями в одном месте."
      >
        <CampaignFilter campaigns={allCampaigns} />
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
                    {summaryKpisToShow.length > 0 && <Separator />}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
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
              {selectedCampaignId
                ? 'В этой кампании нет акций.'
                : 'Акции еще не созданы.'}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
