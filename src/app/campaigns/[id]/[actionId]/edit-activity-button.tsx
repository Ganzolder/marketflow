
"use client";

import { useState, useEffect, useRef, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Edit2 } from "lucide-react";
import { updateActivity } from '@/lib/actions';
import type { ActivityFormState } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import type { Activity } from '@/lib/types';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                </>
            ) : "Сохранить изменения"}
        </Button>
    )
}

export function EditActivityButton({ activity, campaignId, actionId }: { activity: Activity, campaignId: string, actionId: string }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    
    const initialState: ActivityFormState = { message: "", errors: {}, error: false };
    const [state, dispatch] = useActionState(updateActivity, initialState);

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
            }
        }
    }, [state, toast]);
    
    // YYYY-MM-DD format for date input
    const formatDate = (dateString: string) => {
        return new Date(dateString).toISOString().split('T')[0];
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Редактировать активность</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Редактировать активность</DialogTitle>
                    <DialogDescription>
                        Измените информацию об активности.
                    </DialogDescription>
                </DialogHeader>
                <form action={dispatch} ref={formRef}>
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <input type="hidden" name="actionId" value={actionId} />
                    <input type="hidden" name="activityId" value={activity.id} />
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="activity-name">Название активности</Label>
                            <Input id="activity-name" name="activity-name" defaultValue={activity.name} />
                            {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
                        </div>
                        <div className="grid gap-2">
                             <Label htmlFor="description">Описание (необязательно)</Label>
                             <Textarea id="description" name="description" defaultValue={activity.description} />
                             {state.errors?.description && <p className="text-sm text-destructive">{state.errors.description[0]}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="grid gap-2">
                                <Label htmlFor="budget">Бюджет ($)</Label>
                                <Input id="budget" name="budget" type="number" defaultValue={activity.budget} />
                                {state.errors?.budget && <p className="text-sm text-destructive">{state.errors.budget[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="start-date">Дата начала</Label>
                                <Input id="start-date" name="start-date" type="date" defaultValue={formatDate(activity.startDate)} />
                                {state.errors?.startDate && <p className="text-sm text-destructive">{state.errors.startDate[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="end-date">Дата окончания</Label>
                                <Input id="end-date" name="end-date" type="date" defaultValue={formatDate(activity.endDate)} />
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
