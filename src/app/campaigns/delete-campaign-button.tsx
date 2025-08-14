
"use client";

import { useTransition } from 'react';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2, Trash2 } from "lucide-react";
import { deleteCampaign } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

export function DeleteCampaignButton({ campaignId }: { campaignId: string }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const handleDelete = async () => {
        const formData = new FormData();
        formData.append('campaignId', campaignId);
        
        startTransition(async () => {
            const result = await deleteCampaign(formData);
            if (result?.error) {
                toast({
                    variant: "destructive",
                    title: "Ошибка",
                    description: result.message,
                });
            } else {
                 toast({
                    title: "Успех",
                    description: "Кампания успешно удалена.",
                });
                // Redirect is handled by the server action
            }
        })
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                 <Button type="button" variant="destructive" className="mr-auto">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Удалить
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Это действие нельзя отменить. Кампания и все связанные с ней акции и данные будут безвозвратно удалены.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Удаление...
                            </>
                        ) : "Удалить кампанию"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
