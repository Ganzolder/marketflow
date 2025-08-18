
"use client";

import { useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { restoreTask } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArchiveRestore } from 'lucide-react';

export function RestoreTaskButton({ taskId }: { taskId: string }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const handleRestore = () => {
        const formData = new FormData();
        formData.append('taskId', taskId);
        startTransition(async () => {
            const result = await restoreTask(formData);
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
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRestore} disabled={isPending}>
             {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArchiveRestore className="h-4 w-4" />}
        </Button>
    );
}
