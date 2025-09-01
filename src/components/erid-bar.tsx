
"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function EridBar() {
  const [erid, setErid] = useState('');
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    const savedErid = localStorage.getItem('erid');
    if (savedErid) {
      setErid(savedErid);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('erid', erid);
    toast({
      title: 'Сохранено',
      description: 'Значение ERID было успешно сохранено.',
    });
  };

  if (!isClient) {
    return null; // или можно вернуть Skeleton/placeholder
  }

  return (
    <div className="flex items-center gap-2 px-4 sm:px-6 lg:px-8 py-2 border-b bg-muted/40">
      <label htmlFor="erid-input" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
        ERID:
      </label>
      <Input
        id="erid-input"
        type="text"
        value={erid}
        onChange={(e) => setErid(e.target.value)}
        placeholder="Введите идентификатор"
        className="h-8"
      />
      <Button variant="ghost" size="icon" onClick={handleSave} className="h-8 w-8">
        <Save className="h-4 w-4" />
        <span className="sr-only">Сохранить ERID</span>
      </Button>
    </div>
  );
}
