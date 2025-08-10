import { getCampaignById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Edit, Calendar as CalendarIcon, DollarSign, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import { NewActionButton } from './new-action-button';


export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const campaign = await getCampaignById(params.id);

  if (!campaign) {
    notFound();
  }

  const locale = 'ru-RU';
  const currencyOptions = { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 };
  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

  return (
    <div>
      <PageHeader title={campaign.name}>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Редактировать
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

        <div>
          <h2 className="text-2xl font-bold font-headline mb-4">Цели кампании</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campaign.goals.map(goal => (
              <Card key={goal.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{goal.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={(goal.current / goal.target) * 100} className="mb-2 h-3 bg-primary/20" indicatorClassName="bg-primary" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">{goal.current.toLocaleString(locale)}</span> / {goal.target.toLocaleString(locale)} {goal.unit}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold font-headline">Акции</h2>
            <NewActionButton campaignId={campaign.id} />
          </div>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата начала</TableHead>
                    <TableHead>Дата окончания</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaign.actions.map(action => (
                    <TableRow key={action.id}>
                      <TableCell className="font-medium">{action.name}</TableCell>
                      <TableCell>{action.type}</TableCell>
                      <TableCell><StatusBadge status={action.status} /></TableCell>
                      <TableCell>{new Date(action.startDate).toLocaleDateString(locale, dateOptions)}</TableCell>
                      <TableCell>{new Date(action.endDate).toLocaleDateString(locale, dateOptions)}</TableCell>
                    </TableRow>
                  ))}
                  {campaign.actions.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                            Акции еще не добавлены.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
