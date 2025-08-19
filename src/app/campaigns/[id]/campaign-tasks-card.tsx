
"use client";

import type { EnrichedTask } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from '@/components/ui/badge';
import { Calendar, User, ClipboardCheck } from 'lucide-react';
import { UpdateTaskStatus } from '@/app/tasks/update-task-status';

export function CampaignTasksCard({ tasks }: { tasks: EnrichedTask[] }) {
    if (tasks.length === 0) {
        return null;
    }
    const locale = 'ru-RU';

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="w-6 h-6" />
                    Задачи
                </CardTitle>
                <CardDescription>Задачи, связанные с этой сущностью.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Accordion type="multiple" className="w-full space-y-2">
                    {tasks.map(task => (
                        <AccordionItem value={task.id} key={task.id} className="border rounded-md px-4">
                             <AccordionTrigger className="py-3 hover:no-underline">
                                <div className="flex-1 text-left">
                                    <p className="font-semibold">{task.title}</p>
                                </div>
                            </AccordionTrigger>
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
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="text-muted-foreground">Привязка:</span>
                                    {task.campaignName && <Badge variant="outline">{task.campaignName}</Badge>}
                                    {task.actionName && <Badge variant="outline">{task.actionName}</Badge>}
                                    {task.activityName && <Badge variant="outline">{task.activityName}</Badge>}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                 </Accordion>
            </CardContent>
        </Card>
    )
}
