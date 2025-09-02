"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import { useCallback } from 'react';

export function ViewModeToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'grid';

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'grid') {
        params.delete(name);
      } else {
        params.set(name, value);
      }
      return params.toString();
    },
    [searchParams]
  );

  const setView = (view: 'grid' | 'list') => {
    router.push(`${pathname}?${createQueryString('view', view)}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
      <Button
        variant={currentView === 'grid' ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => setView('grid')}
        className="h-8 w-8"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="sr-only">Карточки</span>
      </Button>
      <Button
        variant={currentView === 'list' ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => setView('list')}
        className="h-8 w-8"
      >
        <List className="h-4 w-4" />
        <span className="sr-only">Список</span>
      </Button>
    </div>
  );
}
