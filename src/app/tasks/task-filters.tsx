
"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Campaign, Action } from '@/lib/types';
import { useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const statusTranslations = {
  planned: "Запланирована",
  "in-progress": "В процессе",
  completed: "Выполнена",
};


export function TaskFilters({ campaigns, responsibles }: { campaigns: Campaign[], responsibles: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedCampaignId = searchParams.get('campaignId') || '';
  const selectedActionId = searchParams.get('actionId') || '';
  const selectedStatus = searchParams.get('status') || '';
  const deadlineFrom = searchParams.get('deadlineFrom') || '';
  const deadlineTo = searchParams.get('deadlineTo') || '';
  const responsible = searchParams.get('responsible') || '';

  const [actionsForCampaign, setActionsForCampaign] = useState<Action[]>([]);
  
  useEffect(() => {
    if (selectedCampaignId) {
        const campaign = campaigns.find(c => c.id === selectedCampaignId);
        setActionsForCampaign(campaign?.actions || []);
    } else {
        setActionsForCampaign([]);
    }
  }, [selectedCampaignId, campaigns]);

  const createQueryString = useCallback(
    (updates: { name: string, value: string }[]) => {
      const params = new URLSearchParams(searchParams.toString());
      updates.forEach(({ name, value }) => {
        if (value && value !== 'all') {
            params.set(name, value);
        } else {
            params.delete(name);
        }
      });
      
      return params.toString();
    },
    [searchParams]
  );
  
  const handleFilterChange = (name: string, value: string) => {
    let updates = [{ name, value }];
    if (name === 'campaignId') {
        updates.push({ name: 'actionId', value: 'all' });
    }
    router.push(`${pathname}?${createQueryString(updates)}`);
  };

  const resetFilters = () => {
    router.push(pathname);
  }

  const hasActiveFilters = selectedCampaignId || selectedActionId || selectedStatus || deadlineFrom || deadlineTo || responsible;

  return (
    <Card className="mb-8">
        <CardHeader>
            <CardTitle>Фильтры задач</CardTitle>
            <CardDescription>Используйте поля ниже для фильтрации списка задач.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div className="grid gap-1.5">
                    <Label>Статус</Label>
                    <Select onValueChange={(val) => handleFilterChange('status', val)} value={selectedStatus || 'all'}>
                        <SelectTrigger><SelectValue placeholder="Все статусы" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все статусы</SelectItem>
                            {Object.entries(statusTranslations).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid gap-1.5">
                    <Label>Ответственный</Label>
                    <Select onValueChange={(val) => handleFilterChange('responsible', val)} value={responsible || 'all'}>
                        <SelectTrigger><SelectValue placeholder="Все" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все</SelectItem>
                            {responsibles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="deadlineFrom">Дедлайн от</Label>
                    <Input id="deadlineFrom" type="date" value={deadlineFrom} onChange={e => handleFilterChange('deadlineFrom', e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="deadlineTo">Дедлайн до</Label>
                    <Input id="deadlineTo" type="date" value={deadlineTo} onChange={e => handleFilterChange('deadlineTo', e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                    <Label>Кампания</Label>
                    <Select onValueChange={(val) => handleFilterChange('campaignId', val)} value={selectedCampaignId || 'all'}>
                        <SelectTrigger><SelectValue placeholder="Все кампании" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все кампании</SelectItem>
                            {campaigns.map((campaign) => (
                            <SelectItem key={campaign.id} value={campaign.id}>
                                {campaign.name}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-1.5">
                    <Label>Акция</Label>
                    <Select onValueChange={(val) => handleFilterChange('actionId', val)} value={selectedActionId || 'all'} disabled={!selectedCampaignId}>
                        <SelectTrigger><SelectValue placeholder="Все акции" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все акции</SelectItem>
                            {actionsForCampaign.map((action) => (
                            <SelectItem key={action.id} value={action.id}>
                                {action.name}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 {hasActiveFilters && (
                    <div className="flex items-end">
                        <Button variant="ghost" size="sm" onClick={resetFilters} className="w-full">
                            <X className="mr-2 h-4 w-4" />
                            Сбросить фильтры
                        </Button>
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
  );
}
