
"use client";

import { useState, useEffect } from 'react';
import type { Campaign, Action } from '@/lib/types';
import { getCampaignById } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Edit, Calendar as CalendarIcon, DollarSign, Target, FilePlus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import { NewActionButton } from './new-action-button';
import { EditActionButton } from './edit-action-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

type CampaignDetailPageProps = {
  params: {
    id: string;
  }
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const id = params.id;
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  useEffect(() => {
    if (id) {
      getCampaignById(id).then(campaignData => {
        if (!campaignData) {
          notFound();
        } else {
          setCampaign(campaignData);
        }
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (!campaign) {
    return notFound();
  }
  
  const filteredActions = campaign.actions.filter(action => {
    const actionStartDate = new Date(action.startDate);
    const actionEndDate = new Date(action.endDate);
    const filterStartDate = startDateFilter ? new Date(startDateFilter) : null;
    const filterEndDate = endDateFilter ? new Date(endDateFilter) : null;

    if (filterStartDate && actionStartDate < filterStartDate) {
        return false;
    }
    if (filterEndDate && actionEndDate > filterEndDate) {
        return false;
    }
    return true;
  });

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
                 <div className="grid md:grid-cols-2 gap-4 pt-4">
                    <div className="grid gap-2">
                      <Label htmlFor="start-date-filter">Начало акции после</Label>
                      <Input id="start-date-filter" type="date" value={startDateFilter} onChange={e => setStartDateFilter(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="end-date-filter">Окончание акции до</Label>
                      <Input id="end-date-filter" type="date" value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                    {filteredActions.map(action => (
                        <Link key={action.id} href={`/campaigns/${campaign.id}/${action.id}`} className="block hover:shadow-lg transition-shadow rounded-lg">
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle className="text-lg flex justify-between items-start">
                                        <span>{action.name}</span>
                                        <EditActionButton action={action} campaignId={campaign.id}/>
                                    </CardTitle>
                                    <CardDescription>{action.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <StatusBadge status={action.status} />
                                            <span>{new Date(action.startDate).toLocaleDateString(locale, {month: 'short', day: 'numeric'})} - {new Date(action.endDate).toLocaleDateString(locale, {month: 'short', day: 'numeric'})}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
                 {filteredActions.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-10">
                            <FilePlus className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                             {campaign.actions.length > 0 ? 'Нет акций, соответствующих фильтру.' : 'Акции еще не добавлены.'}
                        </div>
                    )}
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
