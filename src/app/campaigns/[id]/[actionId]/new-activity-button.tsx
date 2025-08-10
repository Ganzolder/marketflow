
"use client";

import { useState, useEffect, useRef, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Loader2 } from "lucide-react";
import { addActivityToAction } from '@/lib/actions';
import type { ActivityFormState } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                </>
            ) : "Сохранить"}
        </Button>
    )
}

export function NewActivityButton({ campaignId, actionId }: { campaignId: string, actionId: string }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    
    const initialState: ActivityFormState = { message: "", errors: {}, error: false };
    const [state, dispatch] = useActionState(addActivityToAction, initialState);

    useEffect(() => {
        if (state.message) {
            if (state.errors || state.error) {
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
                formRef.current?.reset();
            }
        }
    }, [state, toast]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Добавить активность
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Создать новую активность</DialogTitle>
                    <DialogDescription>
                        Заполните информацию о новой активности для вашей акции.
                    </DialogDescription>
                </DialogHeader>
                <form action={dispatch} ref={formRef}>
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <input type="hidden" name="actionId" value={actionId} />
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="activity-name">Название активности</Label>
                            <Input id="activity-name" name="activity-name" placeholder="например, Конкурс в Instagram" />
                            {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
                        </div>
                        <div className="grid gap-2">
                             <Label htmlFor="description">Описание (необязательно)</Label>
                             <Textarea id="description" name="description" placeholder="Опишите детали активности..."/>
                             {state.errors?.description && <p className="text-sm text-destructive">{state.errors.description[0]}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="grid gap-2">
                                <Label htmlFor="budget">Бюджет ($)</Label>
                                <Input id="budget" name="budget" type="number" placeholder="500" />
                                {state.errors?.budget && <p className="text-sm text-destructive">{state.errors.budget[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="start-date">Дата начала</Label>
                                <Input id="start-date" name="start-date" type="date" />
                                {state.errors?.startDate && <p className="text-sm text-destructive">{state.errors.startDate[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="end-date">Дата окончания</Label>
                                <Input id="end-date" name="end-date" type="date" />
                                {state.errors?.endDate && <p className="text-sm text-destructive">{state.errors.endDate[0]}</p>}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Отмена</Button>
                        </DialogClose>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
