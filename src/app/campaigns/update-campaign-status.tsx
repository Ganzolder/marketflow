
"use client";

import { useActionState, useTransition, useEffect } from 'react';
import { updateCampaignStatus, type CampaignStatusFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Campaign, CampaignStatus } from '@/lib/types';
import { StatusBadge } from '@/components/status-badge';

const statusTranslations: Record<CampaignStatus, string> = {
  active: "Активна",
  planned: "Запланирована",
  completed: "Завершена",
  paused: "Приостановлена",
}

export function UpdateCampaignStatus({ campaign }: { campaign: Campaign }) {
    const { toast } = useToast();
    const initialState: CampaignStatusFormState = { message: "" };
    const [isPending, startTransition] = useTransition();

    const formAction = updateCampaignStatus.bind(null);
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

    const handleValueChange = (newStatus: CampaignStatus) => {
        const formData = new FormData();
        formData.append('campaignId', campaign.id);
        formData.append('status', newStatus);
        
        startTransition(() => {
            dispatch(formData);
        });
    };

    return (
        <form>
             <Select onValueChange={handleValueChange} value={campaign.status} disabled={isPending}>
                <SelectTrigger className="h-auto border-none p-0 bg-transparent w-auto focus:ring-0 focus:ring-offset-0 disabled:opacity-70 disabled:cursor-not-allowed [&_svg]:ml-1">
                    <SelectValue asChild>
                         <StatusBadge status={campaign.status} />
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
