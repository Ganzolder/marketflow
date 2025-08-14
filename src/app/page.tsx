import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { getCampaigns, getUpcomingActions } from '@/lib/data';
import { Activity, DollarSign, Target } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";

export default async function Dashboard() {
  const campaigns = await getCampaigns();
  const upcomingActions = await getUpcomingActions();

  const totalBudget = campaigns.reduce((sum, campaign) => sum + campaign.budget, 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const completedActions = campaigns.flatMap(c => c.actions).filter(a => a.status === 'completed').length;
  
  const locale = 'ru-RU';
  const currencyOptions = { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 };
  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

  return (
    <div>
      <PageHeader title="Панель управления" description="Обзор ваших маркетинговых кампаний." />

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
            <CardTitle className="text-sm font-medium">Общий бюджет</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Intl.NumberFormat(locale, currencyOptions).format(totalBudget)}</div>
            <p className="text-xs text-muted-foreground">
              По всем кампаниям
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
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
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
            <CardTitle>Предстоящие акции</CardTitle>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Акция</TableHead>
                  <TableHead className="hidden sm:table-cell">Кампания</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingActions.slice(0, 5).map((action) => (
                  <TableRow key={action.id}>
                    <TableCell className="font-medium">{action.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{action.campaignName}</TableCell>
                    <TableCell>{new Date(action.startDate).toLocaleDateString(locale, {month: 'short', day: 'numeric'})}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
