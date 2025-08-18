
"use client";

import { useState, useEffect, useActionState, useRef, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Edit } from "lucide-react";
import { updateTask, type TaskFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Task, Campaign, Action, Activity } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

const statusTranslations = {
  planned: "Запланирована",
  "in-progress": "В процессе",
  completed: "Выполнена",
};

export function EditTaskButton({ task, campaigns }: { task: Task, campaigns: Campaign[] }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, startTransition] = useTransition();

    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(task.campaignId || null);
    const [actions, setActions] = useState<Action[]>([]);
    const [selectedActionId, setSelectedActionId] = useState<string | null>(task.actionId || null);
    const [activities, setActivities] = useState<Activity[]>([]);
    
    const initialState: TaskFormState = { message: "", errors: {} };
    const [state, dispatch] = useActionState(updateTask, initialState);

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
            }
        }
    }, [state, toast, isPending]);

    useEffect(() => {
        const campaign = campaigns.find(c => c.id === selectedCampaignId);
        setActions(campaign?.actions || []);
        if (!campaign?.actions.find(a => a.id === selectedActionId)) {
            setSelectedActionId(null);
        }
    }, [selectedCampaignId, campaigns, selectedActionId]);

    useEffect(() => {
        const action = actions.find(a => a.id === selectedActionId);
        setActivities(action?.activities || []);
         if (!action?.activities.find(a => a.id === task.activityId)) {
            // Reset if the current activity doesn't belong to the selected action
        }
    }, [selectedActionId, actions, task.activityId]);


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
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl h-[90vh] flex flex-col sm:h-auto sm:max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle>Редактировать задачу</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} ref={formRef} className="flex-1 flex flex-col min-h-0">
                    <input type="hidden" name="taskId" value={task.id} />
                    <ScrollArea className="flex-1 pr-6 -mr-6">
                        <div className="grid gap-4 py-4 pr-6">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Название задачи</Label>
                                <Input id="title" name="title" defaultValue={task.title} />
                                {state?.errors?.title && <p className="text-sm text-destructive">{state.errors.title[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Описание (необязательно)</Label>
                                <Textarea id="description" name="description" defaultValue={task.description} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Статус</Label>
                                    <Select name="status" defaultValue={task.status}>
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
                                    <Input id="deadline" name="deadline" type="date" defaultValue={task.deadline} />
                                    {state?.errors?.deadline && <p className="text-sm text-destructive">{state.errors.deadline[0]}</p>}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="responsiblePerson">Ответственный</Label>
                                <Input id="responsiblePerson" name="responsiblePerson" defaultValue={task.responsiblePerson} />
                                {state?.errors?.responsiblePerson && <p className="text-sm text-destructive">{state.errors.responsiblePerson[0]}</p>}
                            </div>
                             <div className="grid gap-2">
                                <Label>Привязка (необязательно)</Label>
                                <div className="space-y-2 rounded-md border p-4">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="campaignId" className="text-xs">Кампания</Label>
                                        <Select name="campaignId" defaultValue={selectedCampaignId || "none"} onValueChange={setSelectedCampaignId}>
                                            <SelectTrigger><SelectValue placeholder="Выберите кампанию" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Нет</SelectItem>
                                                {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="actionId" className="text-xs">Акция</Label>
                                        <Select name="actionId" disabled={!selectedCampaignId} defaultValue={selectedActionId || "none"} onValueChange={setSelectedActionId}>
                                            <SelectTrigger><SelectValue placeholder="Выберите акцию" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Нет</SelectItem>
                                                {actions.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                     <div className="grid gap-1.5">
                                        <Label htmlFor="activityId" className="text-xs">Активность</Label>
                                        <Select name="activityId" disabled={!selectedActionId} defaultValue={task.activityId || "none"}>
                                            <SelectTrigger><SelectValue placeholder="Выберите активность" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Нет</SelectItem>
                                                {activities.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="mt-auto pt-4 border-t">
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
