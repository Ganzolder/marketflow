
"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Campaign } from '@/lib/types';
import { useCallback } from 'react';

export function CampaignFilter({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCampaign = searchParams.get('campaignId') || 'all';

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'all') {
        params.delete(name);
      } else {
        params.set(name, value);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleValueChange = (campaignId: string) => {
    router.push(pathname + '?' + createQueryString('campaignId', campaignId));
  };

  return (
    <div className="w-full md:w-64">
        <Select onValueChange={handleValueChange} defaultValue={selectedCampaign}>
        <SelectTrigger>
            <SelectValue placeholder="Фильтр по кампании" />
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
  );
}
