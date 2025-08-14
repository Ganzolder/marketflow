
"use client";

import { useState, useEffect, useActionState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Edit, Trash2 } from "lucide-react";
import { editCampaign, type CampaignFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { Campaign } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { DeleteCampaignButton } from './delete-campaign-button';


export function EditCampaignButton({ campaign, asIcon = false }: { campaign: Campaign, asIcon?: boolean }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    
    const initialState: CampaignFormState = { message: "", errors: {} };
    const [state, formAction] = useActionState(editCampaign, initialState);

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
        }
    }, [state, toast]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {asIcon ? (
                    <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Редактировать кампанию</span>
                    </Button>
                ) : (
                    <Button variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        Редактировать кампанию
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                 <form action={formAction} ref={formRef}>
                    <DialogHeader>
                        <DialogTitle>Редактировать кампанию</DialogTitle>
                        <DialogDescription>
                            Измените детали вашей кампании. Нажмите сохранить, когда закончите.
                        </DialogDescription>
                    </DialogHeader>
                    <input type="hidden" name="campaignId" value={campaign.id} />
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Название</Label>
                            <Input id="name" name="name" defaultValue={campaign.name} />
                            {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Описание</Label>
                            <Textarea id="description" name="description" defaultValue={campaign.description} />
                            {state.errors?.description && <p className="text-sm text-destructive">{state.errors.description[0]}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="budget">Бюджет ($)</Label>
                                <Input id="budget" name="budget" type="number" defaultValue={campaign.budget} />
                                {state.errors?.budget && <p className="text-sm text-destructive">{state.errors.budget[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="startDate">Дата начала</Label>
                                <Input id="startDate" name="startDate" type="date" defaultValue={campaign.startDate} />
                                {state.errors?.startDate && <p className="text-sm text-destructive">{state.errors.startDate[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="endDate">Дата окончания</Label>
                                <Input id="endDate" name="endDate" type="date" defaultValue={campaign.endDate} />
                                {state.errors?.endDate && <p className="text-sm text-destructive">{state.errors.endDate[0]}</p>}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DeleteCampaignButton campaignId={campaign.id} />
                        <DialogClose asChild>
                            <Button variant="outline" type="button">Отмена</Button>
                        </DialogClose>
                        <Button type="submit" disabled={state.error === false && !state.errors}>
                            {(state.error === false && !state.errors) ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Сохранение...</> : "Сохранить"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
