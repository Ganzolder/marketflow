
"use client";

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
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
import { deleteSocialPostFromAction, type DeleteFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" variant="destructive" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Удаление...
                </>
            ) : "Удалить"}
        </Button>
    )
}

export function DeleteSocialPostButton({ postId, campaignId, actionId }: { postId: string, campaignId: string, actionId: string }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    
    const initialState: DeleteFormState = { message: "", error: false };
    const [state, dispatch] = useActionState(deleteSocialPostFromAction, initialState);

    useEffect(() => {
        if (state.message) {
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
                setOpen(false);
            }
        }
    }, [state, toast]);

    const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={stopPropagation}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Удалить пост</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={stopPropagation}>
                <AlertDialogHeader>
                    <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Это действие нельзя отменить. Запись о посте будет безвозвратно удалена.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <form action={dispatch}>
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <input type="hidden" name="actionId" value={actionId} />
                    <input type="hidden" name="postId" value={postId} />
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <SubmitButton />
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}
