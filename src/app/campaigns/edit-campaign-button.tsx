
"use client";

import { useState, useEffect, useRef, useTransition, useActionState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Separator } from '@/components/ui/separator';


export function EditCampaignButton({ campaign, asIcon = false }: { campaign: Campaign, asIcon?: boolean }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, startTransition] = useTransition();
    
    const initialState: CampaignFormState = { message: "", errors: {}, fields: {} };
    const [state, formAction] = useActionState(editCampaign, initialState);

    useEffect(() => {
        if (state?.message) {
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
                router.refresh(); // Force a refresh to get new data
            }
        }
    }, [state, toast, router]);
    
    const stopPropagation = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setOpen(true);
    }


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {asIcon ? (
                    <Button variant="ghost" size="icon" onClick={stopPropagation}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Редактировать кампанию</span>
                    </Button>
                ) : (
                    <Button variant="outline" onClick={stopPropagation}>
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
                            {state?.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Описание</Label>
                            <Textarea id="description" name="description" defaultValue={campaign.description} />
                            {state?.errors?.description && <p className="text-sm text-destructive">{state.errors.description[0]}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="budget">Бюджет (р.)</Label>
                                <Input id="budget" name="budget" type="number" defaultValue={campaign.budget} />
                                {state?.errors?.budget && <p className="text-sm text-destructive">{state.errors.budget[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="startDate">Дата начала</Label>
                                <Input id="startDate" name="startDate" type="date" defaultValue={campaign.startDate} />
                                {state?.errors?.startDate && <p className="text-sm text-destructive">{state.errors.startDate[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="endDate">Дата окончания</Label>
                                <Input id="endDate" name="endDate" type="date" defaultValue={campaign.endDate} />
                                {state?.errors?.endDate && <p className="text-sm text-destructive">{state.errors.endDate[0]}</p>}
                            </div>
                        </div>
                        <Separator />
                        <div className="grid gap-2">
                            <Label htmlFor="company">Компания (необязательно)</Label>
                            <Input id="company" name="company" defaultValue={campaign.company || ''} placeholder="Название организации" />
                            {state?.errors?.company && <p className="text-sm text-destructive">{state.errors.company[0]}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="address">Адрес (необязательно)</Label>
                                <Input id="address" name="address" defaultValue={campaign.address || ''} placeholder="Город, улица, дом" />
                                {state?.errors?.address && <p className="text-sm text-destructive">{state.errors.address[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Телефон (необязательно)</Label>
                                <Input id="phone" name="phone" defaultValue={campaign.phone || ''} placeholder="+7 (XXX) XXX-XX-XX" />
                                {state?.errors?.phone && <p className="text-sm text-destructive">{state.errors.phone[0]}</p>}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DeleteCampaignButton campaignId={campaign.id} />
                        <DialogClose asChild>
                            <Button variant="outline" type="button">Отмена</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Сохранение...</> : "Сохранить"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
