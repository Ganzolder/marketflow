

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { getCampaigns, getUpcomingEvents, getAllTasks, getAllSocialPosts } from '@/lib/data';
import { Activity, Landmark, Target, CalendarClock, Share2, ClipboardCheck, TrendingUp, PiggyBank, BarChart, Wand2 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import type { UpcomingEvent } from "@/lib/types";
import { OverallAiAnalyzerButton } from "./overall-ai-analyzer-button";

export default async function Dashboard() {
  const campaigns = await getCampaigns();
  const allTasks = await getAllTasks();
  const allPosts = await getAllSocialPosts();
  const upcomingEvents = await getUpcomingEvents(14); // Get events for the next 14 days

  const totalBudget = campaigns.reduce((sum, campaign) => sum + campaign.budget, 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const completedActions = campaigns.flatMap(c => c.actions).filter(a => a.status === 'completed').length;
  
  let totalSpent = 0;
  let totalRevenue = 0;

  campaigns.forEach(campaign => {
    (campaign.actions || []).forEach(action => {
      const actionSpent = (action.activities?.reduce((sum, activity) => sum + activity.spent, 0) || 0) + (action.generalExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0);
      totalSpent += actionSpent;
      
      const salesKpiName = "Продажи";
      let actualSales = 0;
      action.activities?.forEach(activity => {
          activity.kpis?.forEach(kpi => {
              if (kpi.name === salesKpiName) {
                  actualSales += kpi.current;
              }
          });
      });
      const actualRevenue = actualSales * (action.actualAverageCheck || 0);
      totalRevenue += actualRevenue;
    });
  });

  const totalProfit = totalRevenue - totalSpent;
  
  const locale = 'ru-RU';
  const currencyOptions = { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 };
  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

  const eventIcons: Record<UpcomingEvent['type'], React.ElementType> = {
    task: ClipboardCheck,
    post: Share2,
  };
  
  const upcomingTasks = upcomingEvents.filter(event => event.type === 'task');
  const upcomingPosts = upcomingEvents.filter(event => event.type === 'post');


  return (
    <div>
      <PageHeader title="Панель управления" description="Обзор ваших маркетинговых кампаний.">
        <OverallAiAnalyzerButton campaigns={campaigns} tasks={allTasks} posts={allPosts} />
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные кампании</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              {campaigns.length} всего кампаний
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Завершенные акции</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{completedActions}</div>
            <p className="text-xs text-muted-foreground">
              За все время
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общий бюджет</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Intl.NumberFormat(locale, currencyOptions).format(totalBudget)}</div>
            <p className="text-xs text-muted-foreground">
              Запланировано по всем кампаниям
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего потрачено</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Intl.NumberFormat(locale, currencyOptions).format(totalSpent)}</div>
             <p className="text-xs text-muted-foreground">
              Фактические расходы по всем акциям
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общая выручка</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{new Intl.NumberFormat(locale, currencyOptions).format(totalRevenue)}</div>
             <p className="text-xs text-muted-foreground">
              На основе фактических продаж
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общая прибыль</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-accent' : 'text-destructive'}`}>{new Intl.NumberFormat(locale, currencyOptions).format(totalProfit)}</div>
            <p className="text-xs text-muted-foreground">
              Выручка минус затраты
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Недавние кампании</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Бюджет</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.slice(0, 5).map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <Link href={`/campaigns/${campaign.id}`} className="font-medium hover:underline">
                        {campaign.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={campaign.status} />
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">{new Intl.NumberFormat(locale, currencyOptions).format(campaign.budget)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5"/>
                Ближайшие задачи
            </CardTitle>
            <CardDescription>Задачи на ближайшие 14 дней.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
              <TableBody>
                {upcomingTasks.length > 0 ? upcomingTasks.map((event) => {
                    const Icon = eventIcons[event.type];
                    return (
                        <TableRow key={event.id}>
                            <TableCell className="w-12">
                                <div className="bg-muted p-2 rounded-md flex items-center justify-center">
                                  <Icon className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </TableCell>
                            <TableCell>
                                <Link href={event.link} className="font-medium hover:underline">{event.title}</Link>
                                <div className="text-xs text-muted-foreground hidden sm:block">{event.details}</div>
                            </TableCell>
                            <TableCell className="text-right">
                                <p className="font-medium text-sm">{new Date(event.date).toLocaleDateString(locale, {month: 'short', day: 'numeric'})}</p>
                                <StatusBadge status={event.status} />
                            </TableCell>
                        </TableRow>
                    )
                }) : (
                     <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            Нет предстоящих задач.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5"/>
                Предстоящие публикации
            </CardTitle>
            <CardDescription>Посты в соцсетях на ближайшие 14 дней.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
              <TableBody>
                {upcomingPosts.length > 0 ? upcomingPosts.map((event) => {
                    const Icon = eventIcons[event.type];
                    return (
                        <TableRow key={event.id}>
                            <TableCell className="w-12">
                                <div className="bg-muted p-2 rounded-md flex items-center justify-center">
                                  <Icon className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </TableCell>
                            <TableCell>
                                <Link href={event.link} className="font-medium hover:underline">{event.title}</Link>
                                <div className="text-xs text-muted-foreground hidden sm:block">{event.details}</div>
                            </TableCell>
                            <TableCell className="text-right">
                                <p className="font-medium text-sm">{new Date(event.date).toLocaleDateString(locale, {month: 'short', day: 'numeric'})}</p>
                                <StatusBadge status={event.status} />
                            </TableCell>
                        </TableRow>
                    )
                }) : (
                     <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            Нет предстоящих публикаций.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
