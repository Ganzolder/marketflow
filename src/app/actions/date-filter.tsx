
"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function DateFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );
  
  const handleDateChange = (name: 'startDate' | 'endDate', value: string) => {
    router.push(`${pathname}?${createQueryString(name, value)}`);
  }

  const resetDates = () => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('startDate');
      params.delete('endDate');
      router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
        <div className="grid w-full sm:w-auto gap-1.5">
            <Label htmlFor="startDate" className="text-xs">Начало акции от</Label>
            <Input 
                id="startDate" 
                type="date" 
                value={startDate} 
                onChange={e => handleDateChange('startDate', e.target.value)} 
                className="h-10"
            />
        </div>
         <div className="grid w-full sm:w-auto gap-1.5">
            <Label htmlFor="endDate" className="text-xs">Окончание до</Label>
            <Input 
                id="endDate" 
                type="date" 
                value={endDate} 
                onChange={e => handleDateChange('endDate', e.target.value)}
                className="h-10"
            />
        </div>
        {(startDate || endDate) && (
            <Button variant="ghost" size="icon" onClick={resetDates} className="h-10 w-10">
                <X className="h-4 w-4" />
                <span className="sr-only">Сбросить даты</span>
            </Button>
        )}
    </div>
  );
}
