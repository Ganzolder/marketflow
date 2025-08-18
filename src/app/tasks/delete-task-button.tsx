
"use client";

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2, Trash2 } from "lucide-react";
import { deleteTask, type DeleteFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function DeleteTaskButton({ taskId }: { taskId: string }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        const formData = new FormData();
        formData.append('taskId', taskId);
        startTransition(async () => {
            const result = await deleteTask(formData);
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
                setOpen(false);
            }
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Это действие нельзя отменить. Задача будет безвозвратно удалена.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Удалить"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
