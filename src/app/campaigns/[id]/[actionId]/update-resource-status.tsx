
"use client";

import { useActionState, useTransition, useEffect } from 'react';
import { updateResourceStatus, type ResourceStatusFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Resource, ResourceStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const resourceStatusTranslations: Record<ResourceStatus, string> = {
  draft: "Черновик",
  planned: "Запланировано",
  "in-progress": "В работе",
  ready: "Готово",
};

const resourceStatusStyles: Record<ResourceStatus, string> = {
  draft: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700/50",
  planned: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50",
  "in-progress": "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50",
  ready: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50",
};

export function UpdateResourceStatus({ resource, actionId, campaignId }: { resource: Resource; actionId: string; campaignId: string }) {
    const { toast } = useToast();
    const initialState: ResourceStatusFormState = { message: "" };
    const [isPending, startTransition] = useTransition();

    const formAction = updateResourceStatus.bind(null);
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

    const handleValueChange = (newStatus: ResourceStatus) => {
        const formData = new FormData();
        formData.append('campaignId', campaignId);
        formData.append('actionId', actionId);
        formData.append('resourceId', resource.id);
        formData.append('status', newStatus);
        
        startTransition(() => {
            dispatch(formData);
        });
    };

    return (
        <form onClick={(e) => e.stopPropagation()}>
             <Select onValueChange={handleValueChange} value={resource.status} disabled={isPending}>
                <SelectTrigger className="h-auto border-none p-0 bg-transparent w-auto focus:ring-0 focus:ring-offset-0 disabled:opacity-70 disabled:cursor-not-allowed [&_svg]:ml-1">
                    <SelectValue asChild>
                         <Badge variant="outline" className={resourceStatusStyles[resource.status]}>
                            {resourceStatusTranslations[resource.status]}
                        </Badge>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent onClick={(e) => e.stopPropagation()}>
                    {Object.entries(resourceStatusTranslations).map(([status, translation]) => (
                         <SelectItem key={status} value={status}>{translation}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </form>
    );
}
