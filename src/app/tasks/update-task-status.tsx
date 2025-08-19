
"use client";

import { useActionState, useTransition, useEffect } from 'react';
import { updateTaskStatus, type StatusFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Task, TaskStatus } from '@/lib/types';
import { Badge } from '../ui/badge';

const statusTranslations: Record<TaskStatus, string> = {
  planned: "Запланирована",
  "in-progress": "В процессе",
  completed: "Выполнена",
};

const statusStyles = {
  planned: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50",
  "in-progress": "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50",
  completed: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50",
};

export function UpdateTaskStatus({ task }: { task: Task }) {
    const { toast } = useToast();
    const initialState: StatusFormState = { message: "" };
    const [isPending, startTransition] = useTransition();

    const formAction = updateTaskStatus.bind(null);
    const [state, dispatch] = useActionState(formAction, initialState);

    useEffect(() => {
        if (state?.message) {
            if (state.error) {
                toast({
                    variant: "destructive",
                    title: "Ошибка",
                    description: state.message,
                });
            } else {
                toast({
                    title: "Успех",
                    description: state.message,
                });
            }
        }
    }, [state, toast]);

    const handleValueChange = (newStatus: TaskStatus) => {
        const formData = new FormData();
        formData.append('taskId', task.id);
        formData.append('status', newStatus);
        
        startTransition(() => {
            dispatch(formData);
        });
    };

    return (
        <form>
             <Select onValueChange={handleValueChange} value={task.status} disabled={isPending}>
                <SelectTrigger className="h-auto border-none p-0 bg-transparent w-auto focus:ring-0 focus:ring-offset-0 disabled:opacity-70 disabled:cursor-not-allowed [&_svg]:ml-1">
                    <SelectValue asChild>
                         <Badge variant="outline" className={statusStyles[task.status]}>
                            {statusTranslations[task.status]}
                        </Badge>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(statusTranslations).map(([status, translation]) => (
                         <SelectItem key={status} value={status}>{translation}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </form>
    );
}
