
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
    router.push(`${pathname}?${createQueryString(updates)}`, { scroll: false });
  };

  const resetFilters = () => {
    router.push(pathname);
  }

  const hasActiveFilters = selectedCampaignId || selectedActionId || selectedStatus || deadlineFrom || deadlineTo || responsible;

  return (
    <div className="mb-8 p-4 border rounded-lg bg-card shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            <div className="grid gap-1.5">
                <Label className="text-xs">Статус</Label>
                <Select onValueChange={(val) => handleFilterChange('status', val)} value={selectedStatus || 'all'}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Все" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Все</SelectItem>
                        {Object.entries(statusTranslations).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="grid gap-1.5">
                <Label className="text-xs">Ответственный</Label>
                <Select onValueChange={(val) => handleFilterChange('responsible', val)} value={responsible || 'all'}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Все" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Все</SelectItem>
                        {responsibles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-1.5">
                <Label htmlFor="deadlineFrom" className="text-xs">Дедлайн от</Label>
                <Input id="deadlineFrom" type="date" value={deadlineFrom} onChange={e => handleFilterChange('deadlineFrom', e.target.value)} className="h-9" />
            </div>
            <div className="grid gap-1.5">
                <Label htmlFor="deadlineTo" className="text-xs">Дедлайн до</Label>
                <Input id="deadlineTo" type="date" value={deadlineTo} onChange={e => handleFilterChange('deadlineTo', e.target.value)} className="h-9" />
            </div>
            <div className="grid gap-1.5">
                <Label className="text-xs">Кампания</Label>
                <Select onValueChange={(val) => handleFilterChange('campaignId', val)} value={selectedCampaignId || 'all'}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Все кампании" /></SelectTrigger>
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
                <Label className="text-xs">Акция</Label>
                <Select onValueChange={(val) => handleFilterChange('actionId', val)} value={selectedActionId || 'all'} disabled={!selectedCampaignId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Все акции" /></SelectTrigger>
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
                    <Button variant="ghost" size="sm" onClick={resetFilters} className="w-full h-9">
                        <X className="mr-2 h-4 w-4" />
                        Сбросить
                    </Button>
                </div>
            )}
        </div>
    </div>
  );
}
