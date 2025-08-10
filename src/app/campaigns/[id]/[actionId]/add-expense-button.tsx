
"use client";

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Loader2 } from "lucide-react";
import { addExpense, type ExpenseFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Добавление...</> : "Добавить расход"}
        </Button>
    )
}

export function AddExpenseButton({ activityId, campaignId, actionId }: { activityId: string; campaignId: string; actionId: string; }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    
    const initialState: ExpenseFormState = { message: "", errors: {} };
    const [state, dispatch] = useActionState(addExpense, initialState);

    useEffect(() => {
        if (!state) return;
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Добавить трату
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Добавить расход</DialogTitle>
                    <DialogDescription>
                        Заполните информацию о расходе для этой активности.
                    </DialogDescription>
                </DialogHeader>
                <form action={dispatch}>
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <input type="hidden" name="actionId" value={actionId} />
                    <input type="hidden" name="activityId" value={activityId} />
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="description">Описание</Label>
                            <Textarea id="description" name="description" placeholder="например, Оплата услуг инфлюенсера" />
                            {state?.errors?.description && <p className="text-sm text-destructive">{state.errors.description[0]}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Сумма ($)</Label>
                                <Input id="amount" name="amount" type="number" placeholder="150.00" />
                                {state?.errors?.amount && <p className="text-sm text-destructive">{state.errors.amount[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="date">Дата</Label>
                                <Input id="date" name="date" type="date" />
                                {state?.errors?.date && <p className="text-sm text-destructive">{state.errors.date[0]}</p>}
                            </div>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="legalEntity">Юр. лицо (необязательно)</Label>
                            <Input id="legalEntity" name="legalEntity" placeholder="например, ООО 'Маркетинг'" />
                             {state?.errors?.legalEntity && <p className="text-sm text-destructive">{state.errors.legalEntity[0]}</p>}
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="photoURL">Фото-подтверждение (URL, необязательно)</Label>
                            <Input id="photoURL" name="photoURL" placeholder="https://example.com/receipt.jpg" />
                             {state?.errors?.photoURL && <p className="text-sm text-destructive">{state.errors.photoURL[0]}</p>}
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
