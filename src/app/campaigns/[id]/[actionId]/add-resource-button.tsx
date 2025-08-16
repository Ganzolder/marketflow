
"use client";

import { useState, useEffect, useRef, useActionState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, PlusCircle } from "lucide-react";
import { addResourceToAction, type ResourceFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Expense, ResourceStatus } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

const statusTranslations: Record<ResourceStatus, string> = {
  draft: "Черновик",
  planned: "Запланировано",
  "in-progress": "В работе",
  ready: "Готово",
};

export function AddResourceButton({ actionId, campaignId, expenses }: { actionId: string; campaignId: string; expenses: Expense[] }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    
    const initialState: ResourceFormState = { message: "", errors: {} };
    const [state, dispatch] = useActionState(addResourceToAction, initialState);
    
    useEffect(() => {
        if (state.message) {
            if (state.error) {
                toast({ variant: "destructive", title: "Ошибка", description: state.message });
            } else {
                 toast({ title: "Успех", description: state.message });
                setOpen(false);
                formRef.current?.reset();
            }
        }
    }, [state, toast]);

    const isPending = !!(state && !state.message); // A simple way to detect pending state from useActionState

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Добавить ресурс
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Добавить новый ресурс</DialogTitle>
                    <DialogDescription>
                        Заполните информацию о ресурсе, необходимом для акции.
                    </DialogDescription>
                </DialogHeader>
                <form action={dispatch} ref={formRef}>
                    <ScrollArea className="max-h-[70vh] p-1 pr-4">
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Название ресурса</Label>
                                <Input id="name" name="name" placeholder="например, Промо-материалы" />
                                {state?.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Статус</Label>
                                    <Select name="status" defaultValue="draft">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите статус" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(statusTranslations).map(([key, value]) => (
                                                <SelectItem key={key} value={key}>{value}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="plannedDate">Плановая дата</Label>
                                    <Input id="plannedDate" name="plannedDate" type="date" />
                                    {state?.errors?.plannedDate && <p className="text-sm text-destructive">{state.errors.plannedDate[0]}</p>}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="responsiblePerson">Ответственный</Label>
                                <Input id="responsiblePerson" name="responsiblePerson" placeholder="например, Иванов И.И." />
                                {state?.errors?.responsiblePerson && <p className="text-sm text-destructive">{state.errors.responsiblePerson[0]}</p>}
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="linkedExpenseId">Связать с расходом (необязательно)</Label>
                                <Select name="linkedExpenseId" defaultValue="none">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите расход" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Не связывать</SelectItem>
                                        {expenses.map(expense => (
                                            <SelectItem key={expense.id} value={expense.id}>
                                                {expense.description} ({expense.amount.toLocaleString('ru-RU')} ₽)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="mt-4 pt-4 border-t">
                        <input type="hidden" name="campaignId" value={campaignId} />
                        <input type="hidden" name="actionId" value={actionId} />
                        <DialogClose asChild>
                            <Button variant="outline" type="button">Отмена</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Добавление...</> : "Добавить ресурс"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
