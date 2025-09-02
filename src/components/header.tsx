
'use client';

import { useState, useEffect } from 'react';
import {
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DatabaseActions } from './database-actions';
import { GanttChartSquare, Save, Pencil } from 'lucide-react';
import { GlobalGanttChart } from './global-gantt-chart';
import { ScrollArea } from './ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

function GanttChartModalButton() {
    const [open, setOpen] = useState(false);

    return (
         <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <GanttChartSquare className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Глобальная диаграмма Ганта</DialogTitle>
                    <DialogDescription>
                        Обзор всех кампаний, акций и активностей на временной шкале.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 -mx-6 px-6">
                    <GlobalGanttChart />
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

function EridControl() {
  const [erid, setErid] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    const savedErid = localStorage.getItem('erid');
    if (savedErid) {
      setErid(savedErid);
    } else {
      // If no ERID is saved, start in editing mode
      setIsEditing(true);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('erid', erid);
    setIsEditing(false);
    toast({
      title: 'Сохранено',
      description: 'Значение ERID было успешно сохранено.',
    });
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  }

  if (!isClient) {
    return null; 
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="erid-input" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
        ERID:
      </label>
      {isEditing ? (
        <>
          <Input
            id="erid-input"
            type="text"
            value={erid}
            onChange={(e) => setErid(e.target.value)}
            placeholder="Введите идентификатор"
            className="h-8 w-48"
            autoFocus
          />
          <Button variant="ghost" size="icon" onClick={handleSave} className="h-8 w-8">
            <Save className="h-4 w-4" />
            <span className="sr-only">Сохранить ERID</span>
          </Button>
        </>
      ) : (
        <>
          <div className="h-8 flex items-center px-3 rounded-md border border-transparent">
             <span className="text-sm font-mono">{erid || 'Не указан'}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleEdit} className="h-8 w-8">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Редактировать ERID</span>
          </Button>
        </>
      )}
    </div>
  )
}


export function Header() {
    return (
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
            <SidebarTrigger className="flex md:hidden" />
            <div className="ml-auto flex items-center gap-2">
                <EridControl />
                <GanttChartModalButton />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                             <Avatar className="h-10 w-10">
                                <AvatarImage src="https://placehold.co/100x100.png" alt="@user" data-ai-hint="user avatar" />
                                <AvatarFallback>МФ</AvatarFallback>
                            </Avatar>
                         </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Настройки</DropdownMenuItem>
                        <DropdownMenuItem asChild>
                           <DatabaseActions />
                        </DropdownMenuItem>
                        <DropdownMenuItem>Поддержка</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Выйти</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
