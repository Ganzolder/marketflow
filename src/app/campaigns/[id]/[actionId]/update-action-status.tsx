
"use client";

import { useActionState } from 'react';
import { updateActionStatus, type StatusFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect } from 'react';
import type { Action, ActionStatus } from '@/lib/types';
import { StatusBadge } from '@/components/status-badge';

const statusTranslations: Record<ActionStatus, string> = {
  'in-progress': "В процессе",
  planned: "Запланирована",
  completed: "Завершена",
}

export function UpdateActionStatus({ action, campaignId }: { action: Action; campaignId: string }) {
    const { toast } = useToast();
    const initialState: StatusFormState = { message: "" };

    // We need a unique form identifier for useActionState
    const formAction = updateActionStatus.bind(null);
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

    const handleValueChange = (newStatus: ActionStatus) => {
        const formData = new FormData();
        formData.append('campaignId', campaignId);
        formData.append('actionId', action.id);
        formData.append('status', newStatus);
        dispatch(formData);
    };

    return (
        <form>
             <Select onValueChange={handleValueChange} value={action.status}>
                <SelectTrigger className="h-auto border-none p-0 bg-transparent w-auto focus:ring-0 focus:ring-offset-0">
                    <SelectValue asChild>
                         <StatusBadge status={action.status} />
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
