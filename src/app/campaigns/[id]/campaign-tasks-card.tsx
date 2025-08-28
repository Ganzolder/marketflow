

"use client";

import type { Campaign, EnrichedTask } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from '@/components/ui/button';
import { Calendar, User, ClipboardCheck } from 'lucide-react';
import { UpdateTaskStatus } from '@/app/tasks/update-task-status';
import { AddTaskButton } from '@/app/tasks/add-task-button';
import { EditTaskButton } from '@/app/tasks/edit-task-button';
import { DeleteTaskButton } from '@/app/tasks/delete-task-button';


export function CampaignTasksCard({ tasks, campaigns, defaultCampaignId, defaultActionId }: { tasks: EnrichedTask[], campaigns: Campaign[], defaultCampaignId?: string, defaultActionId?: string }) {
    if (tasks.length === 0 && !defaultCampaignId) {
        return null;
    }
    const locale = 'ru-RU';

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardCheck className="w-6 h-6" />
                        Задачи
                    </CardTitle>
                    <CardDescription>Задачи, связанные с этой сущностью.</CardDescription>
                </div>
                 {defaultCampaignId && <AddTaskButton campaigns={campaigns} defaultCampaignId={defaultCampaignId} defaultActionId={defaultActionId} />}
            </CardHeader>
            <CardContent>
                {tasks.length > 0 ? (
                    <Accordion type="multiple" className="w-full space-y-2">
                        {tasks.map(task => (
                            <AccordionItem value={task.id} key={task.id} className="border rounded-md px-4">
                                <div className="flex items-center w-full">
                                    <AccordionTrigger className="flex-1 py-3 hover:no-underline">
                                        <div className="flex-1 text-left">
                                            <p className="font-semibold">{task.title}</p>
                                        </div>
                                    </AccordionTrigger>
                                     <div className="flex items-center gap-1 pl-2">
                                        <EditTaskButton task={task} />
                                        <DeleteTaskButton taskId={task.id} />
                                    </div>
                                </div>
                                <AccordionContent className="pt-2 pb-4 space-y-4">
                                    {task.description && <p className="text-muted-foreground whitespace-pre-wrap">{task.description}</p>}
                                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>Дедлайн: {new Date(task.deadline).toLocaleDateString(locale)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            <span>Ответственный: {task.responsiblePerson || 'Не назначен'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <UpdateTaskStatus task={task} />
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Задач для этой акции пока нет.</p>
                )}
            </CardContent>
        </Card>
    )
}
