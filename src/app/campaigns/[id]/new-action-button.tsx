
"use client";

import { useState, useEffect, useRef, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Loader2 } from "lucide-react";
import { addActionToCampaign, type ActionFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

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

export function NewActionButton({ campaignId }: { campaignId: string }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    
    const initialState: ActionFormState = { message: "", errors: {} };
    const [state, dispatch] = useActionState(addActionToCampaign, initialState);

    useEffect(() => {
        if (state.message) {
            if (state.errors && Object.keys(state.errors).length > 0) {
                const errorMessages = Object.values(state.errors).flat().join("\n");
                toast({
                    variant: "destructive",
                    title: "Ошибка валидации",
                    description: errorMessages,
                });
            } else if (!state.errors) {
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
                <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Добавить
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Создать новую акцию</DialogTitle>
                    <DialogDescription>
                        Заполните информацию о новой акции для вашей кампании.
                    </DialogDescription>
                </DialogHeader>
                <form action={dispatch} ref={formRef}>
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="action-name">Название акции</Label>
                            <Input id="action-name" name="action-name" placeholder="например, Весенняя распродажа" />
                            {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
                        </div>
                        <div className="grid gap-2">
                             <Label htmlFor="description">Описание</Label>
                             <Textarea id="description" name="description" placeholder="Опишите акцию... (необязательно)"/>
                             {state.errors?.description && <p className="text-sm text-destructive">{state.errors.description[0]}</p>}
                        </div>
                         <div className="grid gap-2">
                             <Label htmlFor="target-audience">Целевая аудитория</Label>
                             <Input id="target-audience" name="target-audience" placeholder="например, Студенты, молодые специалисты... (необязательно)"/>
                             {state.errors?.targetAudience && <p className="text-sm text-destructive">{state.errors.targetAudience[0]}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="address">Адрес</Label>
                                <Input id="address" name="address" placeholder="Город, улица, дом" />
                                {state.errors?.address && <p className="text-sm text-destructive">{state.errors.address[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Телефон</Label>
                                <Input id="phone" name="phone" placeholder="+7 (XXX) XXX-XX-XX" />
                                {state.errors?.phone && <p className="text-sm text-destructive">{state.errors.phone[0]}</p>}
                            </div>
                        </div>
                        <div className="grid gap-2">
                             <Label htmlFor="conditions">Условия акции</Label>
                             <Textarea id="conditions" name="conditions" placeholder="Опишите условия проведения акции... (необязательно)"/>
                             {state.errors?.conditions && <p className="text-sm text-destructive">{state.errors.conditions[0]}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <div className="grid gap-2">
                                <Label htmlFor="status">Статус</Label>
                                <Select name="status" defaultValue="planned">
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Выберите статус" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="planned">Запланирована</SelectItem>
                                        <SelectItem value="in-progress">В процессе</SelectItem>
                                        <SelectItem value="completed">Завершена</SelectItem>
                                    </SelectContent>
                                </Select>
                                {state.errors?.status && <p className="text-sm text-destructive">{state.errors.status[0]}</p>}
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
