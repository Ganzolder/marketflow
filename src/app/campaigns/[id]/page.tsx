
'use client';

import { useState, useEffect } from 'react';
import type { Campaign, Action } from '@/lib/types';
import { getCampaignById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Edit, Calendar as CalendarIcon, DollarSign, Target, FilePlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import { NewActionButton } from './new-action-button';
import { EditActionButton } from './edit-action-button';

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    getCampaignById(params.id).then(campaignData => {
      if (!campaignData) {
        notFound();
      }
      setCampaign(campaignData);
    });
  }, [params.id]);

  if (!campaign) {
    return <div>Загрузка...</div>;
  }

  const locale = 'ru-RU';
  const currencyOptions = { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 };
  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

  return (
    <div>
      <PageHeader title={campaign.name}>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Редактировать кампанию
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

        {/* Actions List */}
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Акции</CardTitle>
                    <NewActionButton campaignId={campaign.id} />
                </div>
                <CardDescription>Список всех акций, связанных с этой кампанией.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {campaign.actions.map(action => (
                        <Card key={action.id}>
                            <CardHeader>
                                <CardTitle className="text-lg flex justify-between items-start">
                                    <span>{action.name}</span>
                                    <EditActionButton action={action} campaignId={campaign.id}/>
                                </CardTitle>
                                <CardDescription>{action.type}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <StatusBadge status={action.status} />
                                        <span>{new Date(action.startDate).toLocaleDateString(locale, {month: 'short', day: 'numeric'})} - {new Date(action.endDate).toLocaleDateString(locale, {month: 'short', day: 'numeric'})}</span>
                                    </div>
                                    <div>
                                         <h4 className="text-sm font-semibold mb-2">Цели</h4>
                                         {action.goals.length > 0 ? (
                                            <div className="space-y-3">
                                            {action.goals.map(goal => (
                                                <div key={goal.id}>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-muted-foreground">{goal.name}</span>
                                                        <span className="font-medium">{Math.round((goal.current / goal.target) * 100)}%</span>
                                                    </div>
                                                    <Progress value={(goal.current / goal.target) * 100} className="h-2" />
                                                    <p className="text-xs text-muted-foreground text-right mt-1">
                                                        {goal.current.toLocaleString(locale)} / {goal.target.toLocaleString(locale)} {goal.unit}
                                                    </p>
                                                </div>
                                            ))}
                                            </div>
                                         ) : (
                                            <p className="text-xs text-muted-foreground">Цели не определены.</p>
                                         )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                 {campaign.actions.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-10">
                            <FilePlus className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                            Акции еще не добавлены.
                        </div>
                    )}
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
