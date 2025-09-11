

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { PageHeader } from '@/components/page-header';
import { getCampaigns, getAllTasks, getAllSocialPosts } from '@/lib/data';
import { UpdateCampaignStatus } from './update-campaign-status';
import { Progress } from '@/components/ui/progress';
import type { CampaignStatus } from '@/lib/types';
import { EditCampaignButton } from './edit-campaign-button';
import { DeleteCampaignButton } from './delete-campaign-button';
import { NewCampaignButton } from './new-campaign-button';
import { Separator } from '@/components/ui/separator';
import { Calendar, Landmark, TrendingUp, ShoppingCart, PiggyBank, BarChart, FilePlus, EyeOff, Archive, ArchiveRestore } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ArchiveCampaignButton } from './archive-campaign-button';
import { Button } from '@/components/ui/button';
import { RestoreCampaignButton } from './restore-campaign-button';
import { cn } from '@/lib/utils';
import { GanttChart } from './gantt-chart';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { OverallAiAnalyzerButton } from '../overall-ai-analyzer-button';

type CampaignsPageProps = {
  searchParams: {
    view?: 'archived';
    ganttCampaigns?: string;
  }
}

export default async function CampaignsPage({ searchParams: searchParamsPromise }: CampaignsPageProps) {
  const searchParams = await searchParamsPromise;
  const campaigns = await getCampaigns();
  const view = searchParams.view;
  
  const filteredCampaigns = campaigns.filter(c => {
    if (view === 'archived') {
        return c.status === 'archived';
    }
    return c.status !== 'archived';
  });

  const locale = 'ru-RU';
  const currencyOptions = { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 };
  const dateOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
  const today = new Date();

  return (
    <div>
      <PageHeader title="Кампании" description="Управляйте и отслеживайте все ваши маркетинговые кампании.">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <OverallAiAnalyzerButton />
          {view === 'archived' ? (
              <Button asChild variant="outline">
                <Link href="/campaigns">
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  Показать активные
                </Link>
              </Button>
          ) : (
             <Button asChild variant="outline">
                <Link href="/campaigns?view=archived">
                  <Archive className="mr-2 h-4 w-4" />
                  Показать архивные
                </Link>
              </Button>
          )}
          <NewCampaignButton />
        </div>
      </PageHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
        {filteredCampaigns.map((campaign) => {
          const startDate = new Date(campaign.startDate);
          const endDate = new Date(campaign.endDate);
          const totalCampaignDuration = Math.max(1, endDate.getTime() - startDate.getTime());
          const elapsedCampaignDuration = Math.max(0, today.getTime() - startDate.getTime());
          let campaignDurationProgress = Math.min(100, (elapsedCampaignDuration / totalCampaignDuration) * 100);

          let totalPlannedSales = 0, totalActualSales = 0;
          let totalPlannedRevenue = 0, totalActualRevenue = 0;
          let totalPlannedBudget = 0, totalActualSpent = 0;
          let totalPlannedProfit = 0, totalActualProfit = 0;
          let totalPlannedNetProfit = 0, totalActualNetProfit = 0;

          (campaign.actions || []).forEach(action => {
              const salesKpiName = action.salesKpiName || "Продажи";
              let plannedSales = 0, actualSales = 0;

              action.activities?.forEach(activity => {
                  activity.kpis?.forEach(kpi => {
                      if (kpi.name === salesKpiName) {
                          plannedSales += kpi.target;
                          actualSales += kpi.current;
                      }
                  });
              });
              
              const plannedActionRevenue = action.plannedRevenue || 0;
              const actualActionRevenue = actualSales * (action.actualAverageCheck || 0);
              const plannedActionProfit = plannedActionRevenue * ((action.plannedMarginality || 0) / 100);
              const actualActionProfit = actualActionRevenue * ((action.actualMarginality || 0) / 100);
              
              const plannedActionBudget = action.activities?.reduce((sum, activity) => sum + activity.budget, 0) || 0;
              const actualActionSpent = (action.activities?.reduce((sum, activity) => sum + activity.spent, 0) || 0) + (action.generalExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0);

              totalPlannedSales += plannedSales;
              totalActualSales += actualSales;
              totalPlannedRevenue += plannedActionRevenue;
              totalActualRevenue += actualActionRevenue;
              totalPlannedBudget += plannedActionBudget;
              totalActualSpent += actualActionSpent;
              totalPlannedProfit += action.plannedProfit || 0;
              totalActualNetProfit += actualActionProfit - actualActionSpent;
          });
          
          return (
            <Card key={campaign.id} className="flex flex-col">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                     <CardTitle className="text-xl">
                        <Link href={`/campaigns/${campaign.id}`} className="hover:underline">
                            {campaign.name}
                        </Link>
                     </CardTitle>
                     <CardDescription className="mt-1">{campaign.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {campaign.status === 'completed' && <ArchiveCampaignButton campaignId={campaign.id} />}
                    {campaign.status === 'archived' && <RestoreCampaignButton campaignId={campaign.id} />}
                    <EditCampaignButton campaign={campaign} asIcon={true} />
                    <DeleteCampaignButton campaignId={campaign.id} asIcon={true} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-md">
                            <Landmark className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-muted-foreground">Выделенный бюджет</p>
                            <p className="font-semibold">{new Intl.NumberFormat(locale, currencyOptions).format(campaign.budget)}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-md">
                            <Landmark className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-muted-foreground">Запланированный бюджет</p>
                            <p className={cn("font-semibold", totalPlannedBudget > campaign.budget && "text-destructive")}>
                                {new Intl.NumberFormat(locale, currencyOptions).format(totalPlannedBudget)}
                            </p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-md">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-muted-foreground">Длительность</p>
                            <p className="font-semibold">
                                {startDate.toLocaleDateString(locale, dateOptions)} - {endDate.toLocaleDateString(locale, dateOptions)}
                            </p>
                        </div>
                    </div>
                     <div>
                      <p className="text-sm text-muted-foreground mb-1">Статус</p>
                      <UpdateCampaignStatus campaign={campaign} />
                    </div>
                </div>
                 
                 <Separator />
                <div className="space-y-4">
                  <h4 className="font-semibold">Ключевые показатели</h4>
                   <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                        {/* Headers */}
                        <div className="font-medium text-muted-foreground">Показатель</div>
                        <div className="grid grid-cols-2 gap-4 text-right">
                          <div className="font-medium text-muted-foreground">План</div>
                          <div className="font-medium text-muted-foreground">Факт</div>
                        </div>

                        {/* Sales */}
                        <div className="flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-primary"/>Продажи, шт.</div>
                        <div className="grid grid-cols-2 gap-4 text-right font-mono">
                          <div>{totalPlannedSales.toLocaleString(locale)}</div>
                          <div className="font-bold text-accent">{totalActualSales.toLocaleString(locale)}</div>
                        </div>

                        {/* Revenue */}
                        <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary"/>Выручка</div>
                        <div className="grid grid-cols-2 gap-4 text-right font-mono">
                          <div>{new Intl.NumberFormat(locale, currencyOptions).format(totalPlannedRevenue)}</div>
                          <div className="font-bold text-accent">{new Intl.NumberFormat(locale, currencyOptions).format(totalActualRevenue)}</div>
                        </div>
                        
                        {/* Spent */}
                        <div className="flex items-center gap-2"><Landmark className="w-4 h-4 text-primary"/>Затраты</div>
                        <div className="grid grid-cols-2 gap-4 text-right font-mono">
                          <div>{new Intl.NumberFormat(locale, currencyOptions).format(totalPlannedBudget)}</div>
                          <div className="font-bold text-accent">{new Intl.NumberFormat(locale, currencyOptions).format(totalActualSpent)}</div>
                        </div>
                        
                        <Separator className="col-span-full"/>

                        {/* Profit */}
                        <div className="flex items-center gap-2"><PiggyBank className="w-4 h-4 text-primary"/>Прибыль (чистая)</div>
                        <div className="grid grid-cols-2 gap-4 text-right font-mono">
                           <div>{new Intl.NumberFormat(locale, currencyOptions).format(totalPlannedNetProfit)}</div>
                           <div className={`font-bold ${totalActualNetProfit >=0 ? 'text-accent' : 'text-destructive'}`}>{new Intl.NumberFormat(locale, currencyOptions).format(totalActualNetProfit)}</div>
                        </div>
                   </div>
                </div>
                 <Separator />
                  <div className="space-y-4">
                    <h4 className="font-semibold">Плановая выручка по акциям</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        {(campaign.actions || []).map(action => (
                            <div key={action.id} className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground">{action.name}</span>
                                <span className="font-mono font-medium">{new Intl.NumberFormat(locale, currencyOptions).format(action.plannedRevenue || 0)}</span>
                            </div>
                        ))}
                    </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 pt-4 border-t">
                  <div className="flex justify-between w-full text-sm text-muted-foreground">
                      <span>Прогресс кампании</span>
                      <span>{Math.round(campaignDurationProgress)}%</span>
                  </div>
                  <Progress value={campaignDurationProgress} className="h-2 w-full" />
              </CardFooter>
            </Card>
          )
        })}
        
        {filteredCampaigns.length === 0 && (
            <Card className="md:col-span-1 lg:col-span-2 xl:col-span-2">
                <CardContent className="text-center h-48 flex flex-col items-center justify-center text-muted-foreground">
                    <FilePlus className="w-8 h-8 mb-2" />
                    <div>
                        {view === 'archived' ? 'Нет кампаний в архиве.' : 'Кампании еще не созданы.'}
                    </div>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
