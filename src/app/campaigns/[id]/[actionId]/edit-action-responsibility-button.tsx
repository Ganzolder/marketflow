
"use client";

import { useState, useEffect, useRef, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Edit2 } from "lucide-react";
import { updateActionResponsibility, type ResponsibilityFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { Action } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

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

export function EditActionResponsibilityButton({ action, campaignId }: { action: Action, campaignId: string }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    
    const initialState: ResponsibilityFormState = { message: "" };
    const [state, dispatch] = useActionState(updateActionResponsibility, initialState);

    useEffect(() => {
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
                <Button variant="outline">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Редактировать
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Редактировать ответственных лиц</DialogTitle>
                    <DialogDescription>
                        Измените данные об ответственных за эту акцию.
                    </DialogDescription>
                </DialogHeader>
                <form action={dispatch} ref={formRef}>
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <input type="hidden" name="actionId" value={action.id} />
                    <ScrollArea className="max-h-[60vh] p-1">
                        <div className="grid gap-4 py-4 pr-4">
                            <div className="grid gap-2">
                                <Label htmlFor="responsiblePerson">ФИО, должность ответственного</Label>
                                <Input id="responsiblePerson" name="responsiblePerson" placeholder="Иванов Иван Иванович, маркетолог" defaultValue={action.responsiblePerson} />
                                {state.errors?.responsiblePerson && <p className="text-sm text-destructive">{state.errors.responsiblePerson[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="marketingHead">ФИО руководителя маркетингового отдела</Label>
                                <Input id="marketingHead" name="marketingHead" placeholder="Петров Петр Петрович" defaultValue={action.marketingHead} />
                                {state.errors?.marketingHead && <p className="text-sm text-destructive">{state.errors.marketingHead[0]}</p>}
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="financeHead">ФИО руководителя финансового отдела</Label>
                                <Input id="financeHead" name="financeHead" placeholder="Сидорова Анна Викторовна" defaultValue={action.financeHead} />
                                {state.errors?.financeHead && <p className="text-sm text-destructive">{state.errors.financeHead[0]}</p>}
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="itHead">ФИО руководителя IT-отдела</Label>
                                <Input id="itHead" name="itHead" placeholder="Козлов Дмитрий Сергеевич" defaultValue={action.itHead} />
                                {state.errors?.itHead && <p className="text-sm text-destructive">{state.errors.itHead[0]}</p>}
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="curator">ФИО, должность куратора</Label>
                                <Input id="curator" name="curator" placeholder="Васильев Василий Васильевич, директор по маркетингу" defaultValue={action.curator} />
                                {state.errors?.curator && <p className="text-sm text-destructive">{state.errors.curator[0]}</p>}
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="pt-4 border-t">
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
