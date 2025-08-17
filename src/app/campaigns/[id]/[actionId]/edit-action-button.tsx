
"use client";

import { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Edit } from "lucide-react";
import { editActionInCampaign, type ActionFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { Action } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

export function EditActionButton({ action, campaignId, asChild = false }: { action: Action, campaignId: string, asChild?: boolean }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, startTransition] = useTransition();
    const [state, setState] = useState<ActionFormState | null>(null);

    useEffect(() => {
        if (state?.message) {
            if (state.error) {
                const errorMessages = state.errors ? Object.values(state.errors).flat().join("\n") : state.message;
                toast({
                    variant: "destructive",
                    title: "Ошибка валидации",
                    description: errorMessages,
                });
            } else {
                 toast({
                    title: "Успех",
                    description: state.message,
                });
                setOpen(false);
                router.refresh(); 
            }
        }
    }, [state, toast, router]);

    const handleFormAction = (formData: FormData) => {
        startTransition(async () => {
            const result = await editActionInCampaign(null, formData);
            setState(result);
        });
    };

    const handleButtonClick = (e: React.MouseEvent) => {
        // Stop propagation if it's nested in a Link or another clickable element
        if (asChild) {
           e.stopPropagation();
           e.preventDefault();
        }
        setOpen(true);
    }
    
    const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

    const TriggerButton = (
        <Button 
          variant={asChild ? "ghost" : "outline"} 
          className={asChild ? "w-full justify-start p-2 h-auto" : "h-6 w-6"}
          size={asChild ? undefined : "icon"}
          onClick={handleButtonClick}
        >
            <Edit className="h-4 w-4" />
            {asChild && <span className="ml-2">Редактировать</span>}
            {!asChild && <span className="sr-only">Редактировать акцию</span>}
        </Button>
    );
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {TriggerButton}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]" onClick={asChild ? stopPropagation : undefined}>
                <DialogHeader>
                    <DialogTitle>Редактировать акцию</DialogTitle>
                    <DialogDescription>
                        Измените информацию об акции для вашей кампании.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleFormAction} ref={formRef}>
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <input type="hidden" name="actionId" value={action.id} />
                    <ScrollArea className="max-h-[70vh] p-1 pr-4">
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="action-name">Название акции</Label>
                                <Input id="action-name" name="action-name" defaultValue={action.name} />
                                {state?.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                 <Label htmlFor="description">Описание</Label>
                                 <Textarea id="description" name="description" placeholder="Опишите акцию... (необязательно)" defaultValue={action.description}/>
                                 {state?.errors?.description && <p className="text-sm text-destructive">{state.errors.description[0]}</p>}
                            </div>
                             <div className="grid gap-2">
                                 <Label htmlFor="target-audience">Целевая аудитория</Label>
                                 <Input id="target-audience" name="target-audience" placeholder="например, Студенты... (необязательно)" defaultValue={action.targetAudience}/>
                                 {state?.errors?.targetAudience && <p className="text-sm text-destructive">{state.errors.targetAudience[0]}</p>}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="start-date">Дата начала</Label>
                                    <Input id="start-date" name="start-date" type="date" defaultValue={action.startDate} />
                                    {state?.errors?.startDate && <p className="text-sm text-destructive">{state.errors.startDate[0]}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="end-date">Дата окончания</Label>
                                    <Input id="end-date" name="end-date" type="date" defaultValue={action.endDate} />
                                    {state?.errors?.endDate && <p className="text-sm text-destructive">{state.errors.endDate[0]}</p>}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="border-t pt-4 mt-4">
                        <DialogClose asChild>
                            <Button variant="outline">Отмена</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Сохранение...
                                </>
                            ) : "Сохранить изменения"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
