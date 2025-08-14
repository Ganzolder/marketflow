
"use client";

import { useState, useEffect, useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, PlusCircle } from "lucide-react";
import { createCampaign, type CampaignFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                </>
            ) : "Создать кампанию"}
        </Button>
    )
}

export function NewCampaignButton() {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    
    const initialState: CampaignFormState = { message: "", errors: {} };
    const [state, formAction] = useActionState(createCampaign, initialState);

    useEffect(() => {
        if (state.message && state.errors) {
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: state.message,
            });
        } else if(state.message) {
             toast({
                title: "Успех",
                description: state.message,
            });
            setOpen(false);
            formRef.current?.reset();
        }
    }, [state, toast]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                 <Button className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Создать кампанию
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                 <form action={formAction} ref={formRef}>
                    <DialogHeader>
                        <DialogTitle>Создать новую кампанию</DialogTitle>
                        <DialogDescription>
                            Заполните детали вашей новой кампании. Нажмите сохранить, когда закончите.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Название</Label>
                            <Input id="name" name="name" placeholder="например, Зимняя распродажа 2025" />
                            {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Описание</Label>
                            <Textarea id="description" name="description" placeholder="Опишите цели и задачи кампании..." />
                            {state.errors?.description && <p className="text-sm text-destructive">{state.errors.description[0]}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="budget">Бюджет (₽)</Label>
                                <Input id="budget" name="budget" type="number" placeholder="50000" />
                                {state.errors?.budget && <p className="text-sm text-destructive">{state.errors.budget[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="startDate">Дата начала</Label>
                                <Input id="startDate" name="startDate" type="date" />
                                {state.errors?.startDate && <p className="text-sm text-destructive">{state.errors.startDate[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="endDate">Дата окончания</Label>
                                <Input id="endDate" name="endDate" type="date" />
                                {state.errors?.endDate && <p className="text-sm text-destructive">{state.errors.endDate[0]}</p>}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" type="button">Отмена</Button>
                        </DialogClose>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
