
"use client";

import { useState } from 'react';
import { useTransition } from 'react';
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
import { deleteCampaign } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function DeleteCampaignButton({ campaignId, asIcon = false }: { campaignId: string, asIcon?: boolean }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
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
                setOpen(false);
                router.push('/campaigns');
            }
        })
    };
    
    const stopPropagation = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
    }
    
    const handleTriggerClick = (e: React.MouseEvent) => {
        stopPropagation(e);
        setOpen(true);
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                {asIcon ? (
                     <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={handleTriggerClick}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Удалить кампанию</span>
                    </Button>
                ) : (
                    <Button type="button" variant="destructive" className="mr-auto" onClick={handleTriggerClick}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Удалить
                    </Button>
                )}
            </AlertDialogTrigger>
            <AlertDialogContent onClick={stopPropagation}>
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
