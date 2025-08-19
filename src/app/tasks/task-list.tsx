
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Calendar, User, ClipboardCheck, Archive, ArchiveRestore } from 'lucide-react';
import type { EnrichedTask, Campaign } from '@/lib/types';
import { TaskFilters } from './task-filters';
import { AddTaskButton } from './add-task-button';
import { EditTaskButton } from './edit-task-button';
import { DeleteTaskButton } from './delete-task-button';
import { ArchiveTaskButton } from './archive-task-button';
import { RestoreTaskButton } from './restore-task-button';
import { TaskLinkControl } from './task-link-control';
import { UpdateTaskStatus } from './update-task-status';

export function TaskList({ initialTasks, allCampaigns, allTasks }: { initialTasks: EnrichedTask[], allCampaigns: Campaign[], allTasks: EnrichedTask[] }) {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');
  const locale = 'ru-RU';
  
  const allResponsibles = Array.from(new Set(allTasks.map(t => t.responsiblePerson).filter(Boolean)));

  return (
    <div>
      <PageHeader title="Задачи" description="Управляйте всеми задачами в одном месте.">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
             {view === 'archived' ? (
              <Button asChild variant="outline">
                <Link href="/tasks">
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  Активные задачи
                </Link>
              </Button>
            ) : (
                <>
                 <Button asChild variant="outline">
                    <Link href="/tasks?view=archived">
                      <Archive className="mr-2 h-4 w-4" />
                      Архив
                    </Link>
                  </Button>
                  <TaskFilters campaigns={allCampaigns} responsibles={allResponsibles}/>
                  <AddTaskButton campaigns={allCampaigns} />
                </>
            )}
        </div>
      </PageHeader>
      
      <div className="space-y-4">
        {initialTasks.map(task => (
            <Card key={task.id}>
                <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                            <CardTitle>{task.title}</CardTitle>
                            {task.description && <CardDescription className="mt-2 whitespace-pre-wrap">{task.description}</CardDescription>}
                        </div>
                        <div className="flex items-center gap-1">
                            {view !== 'archived' && <EditTaskButton task={task} />}
                             {view === 'archived' ? (
                                <RestoreTaskButton taskId={task.id} />
                            ) : (
                                <ArchiveTaskButton taskId={task.id} />
                            )}
                            <DeleteTaskButton taskId={task.id} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <TaskLinkControl task={task} campaigns={allCampaigns} />
                </CardContent>
                <CardFooter className="flex-wrap gap-x-6 gap-y-2 text-sm justify-between">
                     <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Дедлайн: {new Date(task.deadline).toLocaleDateString(locale)}</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>Ответственный: {task.responsiblePerson || 'Не назначен'}</span>
                        </div>
                    </div>
                     <UpdateTaskStatus task={task} />
                </CardFooter>
            </Card>
        ))}
         {initialTasks.length === 0 && (
            <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                     {view === 'archived' ? 'Нет задач в архиве.' : 'Нет задач, соответствующих фильтрам.'}
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
