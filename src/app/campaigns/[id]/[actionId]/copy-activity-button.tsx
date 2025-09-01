
"use client";

import { useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Copy } from "lucide-react";
import { copyActivity, type DeleteFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

export function CopyActivityButton({ activityId, campaignId, actionId }: { activityId: string, campaignId: string, actionId: string }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleCopy = () => {
        const formData = new FormData();
        formData.append('campaignId', campaignId);
        formData.append('actionId', actionId);
        formData.append('activityId', activityId);

        startTransition(async () => {
            const result = await copyActivity(null, formData);
             if (result.error) {
                toast({
                    variant: "destructive",
                    title: "Ошибка",
                    description: result.message,
                });
            } else {
                 toast({
                    title: "Успех",
                    description: result.message,
                });
            }
        });
    };

    return (
        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={handleCopy} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
            <span className="sr-only">Копировать активность</span>
        </Button>
    );
}
