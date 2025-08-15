
"use client";

import { useState, useEffect, useRef, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Edit } from "lucide-react";
import { editActionInCampaign, type ActionFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { Action } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
            ) : "Сохранить изменения"}
        </Button>
    )
}

export function EditActionButton({ action, campaignId }: { action: Action, campaignId: string }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    
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
            }
        }
    }, [state, toast]);
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Редактировать
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
                    <ScrollArea className="max-h-[70vh] p-1 pr-4">
                        <div className="grid gap-4 py-4">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            </div>

                            <Separator className="my-2" />

                            <div className="grid gap-4">
                                <h3 className="text-base font-medium">Ответственные лица</h3>
                                <div className="grid gap-2">
                                    <Label htmlFor="responsiblePerson">ФИО, должность ответственного</Label>
                                    <Input id="responsiblePerson" name="responsiblePerson" placeholder="Иванов Иван Иванович, маркетолог" defaultValue={action.responsiblePerson || ''} />
                                    {state.errors?.responsiblePerson && <p className="text-sm text-destructive">{state.errors.responsiblePerson[0]}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="marketingHead">ФИО руководителя маркетингового отдела</Label>
                                    <Input id="marketingHead" name="marketingHead" placeholder="Петров Петр Петрович" defaultValue={action.marketingHead || ''} />
                                    {state.errors?.marketingHead && <p className="text-sm text-destructive">{state.errors.marketingHead[0]}</p>}
                                </div>
                                    <div className="grid gap-2">
                                    <Label htmlFor="salesHead">ФИО руководителя отдела продаж</Label>
                                    <Input id="salesHead" name="salesHead" placeholder="Смирнова Ольга Ивановна" defaultValue={action.salesHead || ''} />
                                    {state.errors?.salesHead && <p className="text-sm text-destructive">{state.errors.salesHead[0]}</p>}
                                </div>
                                    <div className="grid gap-2">
                                    <Label htmlFor="financeHead">ФИО руководителя финансового отдела</Label>
                                    <Input id="financeHead" name="financeHead" placeholder="Сидорова Анна Викторовна" defaultValue={action.financeHead || ''} />
                                    {state.errors?.financeHead && <p className="text-sm text-destructive">{state.errors.financeHead[0]}</p>}
                                </div>
                                    <div className="grid gap-2">
                                    <Label htmlFor="itHead">ФИО руководителя IT-отдела</Label>
                                    <Input id="itHead" name="itHead" placeholder="Козлов Дмитрий Сергеевич" defaultValue={action.itHead || ''} />
                                    {state.errors?.itHead && <p className="text-sm text-destructive">{state.errors.itHead[0]}</p>}
                                </div>
                                    <div className="grid gap-2">
                                    <Label htmlFor="curator">ФИО, должность куратора</Label>
                                    <Input id="curator" name="curator" placeholder="Васильев Василий Васильевич, директор по маркетингу" defaultValue={action.curator || ''} />
                                    {state.errors?.curator && <p className="text-sm text-destructive">{state.errors.curator[0]}</p>}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="border-t pt-4 mt-4">
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
