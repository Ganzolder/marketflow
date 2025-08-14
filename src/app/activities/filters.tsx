
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
import type { Campaign, EnrichedAction } from '@/lib/types';
import { useCallback, useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';

export function Filters({ campaigns, allActions }: { campaigns: Campaign[], allActions: EnrichedAction[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedCampaignId = searchParams.get('campaignId') || '';
  const selectedActionId = searchParams.get('actionId') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const [actionsForCampaign, setActionsForCampaign] = useState<EnrichedAction[]>([]);
  
  useEffect(() => {
    if (selectedCampaignId) {
        setActionsForCampaign(allActions.filter(action => action.campaignId === selectedCampaignId));
    } else {
        setActionsForCampaign(allActions);
    }
  }, [selectedCampaignId, allActions]);

  const createQueryString = useCallback(
    (updates: { name: string, value: string }[]) => {
      const params = new URLSearchParams(searchParams.toString());
      updates.forEach(({ name, value }) => {
        if (value) {
            params.set(name, value);
        } else {
            params.delete(name);
        }
      });
      
      return params.toString();
    },
    [searchParams]
  );
  
  const handleCampaignChange = (campaignId: string) => {
    const newQueryString = createQueryString([
        { name: 'campaignId', value: campaignId === 'all' ? '' : campaignId },
        { name: 'actionId', value: '' } // Reset action when campaign changes
    ]);
    router.push(`${pathname}?${newQueryString}`);
  };

  const handleActionChange = (actionId: string) => {
    const newQueryString = createQueryString([{ name: 'actionId', value: actionId === 'all' ? '' : actionId }]);
    router.push(`${pathname}?${newQueryString}`);
  }
  
  const handleDateChange = (name: 'startDate' | 'endDate', value: string) => {
    const newQueryString = createQueryString([{ name, value }]);
    router.push(`${pathname}?${newQueryString}`);
  }

  const resetFilters = () => {
    router.push(pathname);
  }

  const hasActiveFilters = selectedCampaignId || selectedActionId || startDate || endDate;

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
                    <h4 className="font-medium leading-none">Фильтры</h4>
                    <p className="text-sm text-muted-foreground">
                        Отфильтруйте активности по нужным параметрам.
                    </p>
                </div>
                <div className="grid gap-2">
                    <div className="grid grid-cols-1 items-center gap-2">
                        <Label>Кампания</Label>
                        <Select onValueChange={handleCampaignChange} value={selectedCampaignId || 'all'}>
                            <SelectTrigger>
                                <SelectValue placeholder="Все кампании" />
                            </SelectTrigger>
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
                        <Select onValueChange={handleActionChange} value={selectedActionId || 'all'} disabled={!selectedCampaignId && actionsForCampaign.length !== allActions.length}>
                            <SelectTrigger>
                                <SelectValue placeholder="Все акции" />
                            </SelectTrigger>
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
                     <div className="grid grid-cols-2 items-center gap-2">
                        <div className="space-y-1">
                           <Label htmlFor="startDate">Начало</Label>
                           <Input id="startDate" type="date" value={startDate} onChange={e => handleDateChange('startDate', e.target.value)} />
                        </div>
                         <div className="space-y-1">
                           <Label htmlFor="endDate">Окончание</Label>
                           <Input id="endDate" type="date" value={endDate} onChange={e => handleDateChange('endDate', e.target.value)} />
                        </div>
                    </div>
                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={resetFilters}>
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
