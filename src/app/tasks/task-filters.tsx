
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';

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
    <Popover>
        <PopoverTrigger asChild>
            <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Фильтры
                {hasActiveFilters && <span className="ml-2 h-2 w-2 rounded-full bg-primary animate-pulse"></span>}
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
            <div className="grid gap-4">
                <div className="space-y-2">
                    <h4 className="font-medium leading-none">Фильтры задач</h4>
                    <p className="text-sm text-muted-foreground">
                        Отфильтруйте задачи по нужным параметрам.
                    </p>
                </div>
                <div className="grid gap-4">
                    <div className="grid grid-cols-1 items-center gap-2">
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
                     <div className="grid grid-cols-1 items-center gap-2">
                        <Label>Ответственный</Label>
                        <Select onValueChange={(val) => handleFilterChange('responsible', val)} value={responsible || 'all'}>
                             <SelectTrigger><SelectValue placeholder="Все" /></SelectTrigger>
                             <SelectContent>
                                <SelectItem value="all">Все</SelectItem>
                                {responsibles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-2 items-center gap-2">
                        <div className="space-y-1">
                           <Label htmlFor="deadlineFrom">Дедлайн от</Label>
                           <Input id="deadlineFrom" type="date" value={deadlineFrom} onChange={e => handleFilterChange('deadlineFrom', e.target.value)} />
                        </div>
                         <div className="space-y-1">
                           <Label htmlFor="deadlineTo">Дедлайн до</Label>
                           <Input id="deadlineTo" type="date" value={deadlineTo} onChange={e => handleFilterChange('deadlineTo', e.target.value)} />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 items-center gap-2">
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
                     <div className="grid grid-cols-1 items-center gap-2">
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
                        <Button variant="ghost" size="sm" onClick={resetFilters} className="justify-center">
                            <X className="mr-2 h-4 w-4" />
                            Сбросить фильтры
                        </Button>
                    )}
                </div>
            </div>
        </PopoverContent>
    </Popover>
  );
}
