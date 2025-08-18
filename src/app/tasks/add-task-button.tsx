
"use client";

import { useState, useEffect, useActionState, useRef, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, PlusCircle } from "lucide-react";
import { addTask, type TaskFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Campaign, Action, Activity } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

const statusTranslations = {
  planned: "Запланирована",
  "in-progress": "В процессе",
  completed: "Выполнена",
};

export function AddTaskButton({ campaigns }: { campaigns: Campaign[] }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, startTransition] = useTransition();
    
    const initialState: TaskFormState = { message: "", errors: {} };
    const [state, dispatch] = useActionState(addTask, initialState);

    useEffect(() => {
        if (state.message && !isPending) {
            if (state.error) {
                const errorMessages = state.errors ? Object.values(state.errors).flat().join("\n") : state.message;
                toast({
                    variant: "destructive",
                    title: "Ошибка валидации",
                    description: errorMessages,
                });
            } else {
                 toast({ title: "Успех", description: state.message });
                setOpen(false);
                formRef.current?.reset();
            }
        }
    }, [state, toast, isPending]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => {
            dispatch(formData);
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Новая задача
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl h-[90vh] flex flex-col sm:h-auto sm:max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle>Создать новую задачу</DialogTitle>
                    <DialogDescription>
                        Заполните информацию о задаче.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} ref={formRef} className="flex-1 flex flex-col min-h-0">
                    <ScrollArea className="flex-1 pr-6 -mr-6">
                        <div className="grid gap-4 py-4 pr-6">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Название задачи</Label>
                                <Input id="title" name="title" placeholder="например, Подготовить отчет по SMM" />
                                {state?.errors?.title && <p className="text-sm text-destructive">{state.errors.title[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Описание (необязательно)</Label>
                                <Textarea id="description" name="description" placeholder="Детали задачи..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Статус</Label>
                                    <Select name="status" defaultValue="planned">
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(statusTranslations).map(([key, val]) => (
                                                <SelectItem key={key} value={key}>{val}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="deadline">Дедлайн</Label>
                                    <Input id="deadline" name="deadline" type="date" />
                                    {state?.errors?.deadline && <p className="text-sm text-destructive">{state.errors.deadline[0]}</p>}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="responsiblePerson">Ответственный</Label>
                                <Input id="responsiblePerson" name="responsiblePerson" placeholder="Иванов И.И." />
                                {state?.errors?.responsiblePerson && <p className="text-sm text-destructive">{state.errors.responsiblePerson[0]}</p>}
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="mt-auto pt-4 border-t">
                        <DialogClose asChild>
                            <Button variant="outline" type="button">Отмена</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Добавление...</> : "Создать задачу"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
