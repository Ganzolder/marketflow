
"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCallback } from 'react';
import type { CampaignStatus } from '@/lib/types';

const statusTranslations: Record<CampaignStatus, string> = {
  active: "Активна",
  planned: "Запланирована",
  completed: "Завершена",
  paused: "Приостановлена",
}

export function CampaignStatusFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedStatus = searchParams.get('status') || 'all';

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

  const handleValueChange = (status: string) => {
    router.push(pathname + '?' + createQueryString('status', status));
  };

  return (
    <div className="w-full md:w-64">
        <Select onValueChange={handleValueChange} defaultValue={selectedStatus}>
        <SelectTrigger>
            <SelectValue placeholder="Фильтр по статусу" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {Object.entries(statusTranslations).map(([status, translation]) => (
                <SelectItem key={status} value={status}>
                    {translation}
                </SelectItem>
            ))}
        </SelectContent>
        </Select>
    </div>
  );
}
