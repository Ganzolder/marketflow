
"use client";

import { useState, useEffect, useRef, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Edit2 } from "lucide-react";
import { editActionInCampaign, type ActionFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { Action } from '@/lib/types';
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
            ) : "Сохранить изменения"}
        </Button>
    )
}

export function EditActionButton({ action, campaignId }: { action: Action, campaignId: string }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const router = useRouter();
    
    const initialState: ActionFormState = { message: "", errors: {} };
    const [state, dispatch] = useActionState(editActionInCampaign, initialState);

    useEffect(() => {
        if (state.message) {
            if (state.errors) {
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
                router.refresh();
            }
        }
    }, [state, toast, router]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Редактировать акцию</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Редактировать акцию</DialogTitle>
                    <DialogDescription>
                        Измените информацию об акции для вашей кампании.
                    </DialogDescription>
                </DialogHeader>
                <form action={dispatch} ref={formRef}>
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <input type="hidden" name="actionId" value={action.id} />
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="action-name">Название акции</Label>
                            <Input id="action-name" name="action-name" defaultValue={action.name} />
                            {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
                        </div>
                        <div className="grid gap-2">
                             <Label htmlFor="description">Описание</Label>
                             <Textarea id="description" name="description" placeholder="Опишите акцию... (необязательно)" defaultValue={action.description}/>
                             {state.errors?.description && <p className="text-sm text-destructive">{state.errors.description[0]}</p>}
                        </div>
                         <div className="grid gap-2">
                             <Label htmlFor="target-audience">Целевая аудитория</Label>
                             <Input id="target-audience" name="target-audience" placeholder="например, Студенты... (необязательно)" defaultValue={action.targetAudience}/>
                             {state.errors?.targetAudience && <p className="text-sm text-destructive">{state.errors.targetAudience[0]}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="start-date">Дата начала</Label>
                                <Input id="start-date" name="start-date" type="date" defaultValue={action.startDate} />
                                {state.errors?.startDate && <p className="text-sm text-destructive">{state.errors.startDate[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="end-date">Дата окончания</Label>
                                <Input id="end-date" name="end-date" type="date" defaultValue={action.endDate} />
                                {state.errors?.endDate && <p className="text-sm text-destructive">{state.errors.endDate[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Статус</Label>
                                <Select name="status" defaultValue={action.status}>
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
