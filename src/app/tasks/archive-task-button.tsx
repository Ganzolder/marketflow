
"use client";

import { useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { archiveTask } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Archive } from 'lucide-react';

export function ArchiveTaskButton({ taskId }: { taskId: string }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const handleArchive = () => {
        const formData = new FormData();
        formData.append('taskId', taskId);
        startTransition(async () => {
            const result = await archiveTask(formData);
            if (result?.error) {
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
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleArchive} disabled={isPending}>
             {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
        </Button>
    );
}
