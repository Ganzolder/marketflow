
"use client";

import { useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, ArchiveRestore } from "lucide-react";
import { updateCampaignStatus } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function RestoreCampaignButton({ campaignId }: { campaignId: string }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const handleRestore = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('campaignId', campaignId);
        formData.append('status', 'completed'); // Restore to 'completed' status
        
        startTransition(async () => {
            const result = await updateCampaignStatus(null, formData);
            if (result?.error) {
                toast({
                    variant: "destructive",
                    title: "Ошибка",
                    description: result.message,
                });
            } else {
                 toast({
                    title: "Успех",
                    description: "Кампания восстановлена из архива.",
                });
            }
        })
    };

    return (
         <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleRestore} disabled={isPending}>
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ArchiveRestore className="h-4 w-4" />
                        )}
                        <span className="sr-only">Восстановить кампанию</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Восстановить кампанию</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
