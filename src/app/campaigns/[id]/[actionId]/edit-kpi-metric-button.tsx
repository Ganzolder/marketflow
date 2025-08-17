
"use client";

import { useState, useEffect, useRef, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Pencil } from "lucide-react";
import { editKpiMetric, type KpiMetricFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { KpiMetricLog } from '@/lib/types';

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

type EditKpiMetricButtonProps = {
    log: KpiMetricLog;
    kpiId: string;
    activityId: string;
    actionId: string;
    campaignId: string;
}

export function EditKpiMetricButton({ log, kpiId, activityId, actionId, campaignId }: EditKpiMetricButtonProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    const initialState: KpiMetricFormState = { message: "" };
    const [state, dispatch] = useActionState(editKpiMetric, initialState);

    useEffect(() => {
        if (state.message) {
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
            }
        }
    }, [state, toast]);

    const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={stopPropagation}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Редактировать запись</span>
                </Button>
            </DialogTrigger>
            <DialogContent onClick={stopPropagation}>
                <DialogHeader>
                    <DialogTitle>Редактировать запись KPI</DialogTitle>
                    <DialogDescription>
                        Измените дату или значение для этой записи.
                    </DialogDescription>
                </DialogHeader>
                <form action={dispatch} ref={formRef}>
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <input type="hidden" name="actionId" value={actionId} />
                    <input type="hidden" name="activityId" value={activityId} />
                    <input type="hidden" name="kpiId" value={kpiId} />
                    <input type="hidden" name="logId" value={log.id} />

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="date">Дата</Label>
                                <Input id="date" name="date" type="date" defaultValue={log.date} />
                                {state?.errors?.date && <p className="text-sm text-destructive">{state.errors.date[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="value">Значение</Label>
                                <Input id="value" name="value" type="number" defaultValue={log.value} />
                                {state?.errors?.value && <p className="text-sm text-destructive">{state.errors.value[0]}</p>}
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
