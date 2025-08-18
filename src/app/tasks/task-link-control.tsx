

"use client";

import { useState, useEffect, useActionState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Link as LinkIcon, Save } from "lucide-react";
import type { Task, Campaign, Action, Activity } from '@/lib/types';
import { updateTaskLinks, type TaskLinkState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export function TaskLinkControl({ task, campaigns }: { task: Task, campaigns: Campaign[] }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [selectedCampaignId, setSelectedCampaignId] = useState<string>(task.campaignId || '');
    const [actions, setActions] = useState<Action[]>([]);
    const [selectedActionId, setSelectedActionId] = useState<string>(task.actionId || '');
    const [activities, setActivities] = useState<Activity[]>([]);
    const [selectedActivityId, setSelectedActivityId] = useState<string>(task.activityId || '');
    
    const initialState: TaskLinkState = { message: "", errors: {} };
    const [state, dispatch] = useActionState(updateTaskLinks, initialState);

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
        if (campaign?.actions?.every(a => a.id !== selectedActionId)) {
            setSelectedActionId('');
        }
    }, [selectedCampaignId, campaigns, selectedActionId]);

    useEffect(() => {
        const action = actions.find(a => a.id === selectedActionId);
        setActivities(action?.activities || []);
        if (action?.activities?.every(a => a.id !== selectedActivityId)) {
            setSelectedActivityId('');
        }
    }, [selectedActionId, actions, selectedActivityId]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => {
            dispatch(formData);
        });
    }
    
    const currentCampaign = campaigns.find(c => c.id === task.campaignId);
    const currentAction = currentCampaign?.actions.find(a => a.id === task.actionId);
    const currentActivity = currentAction?.activities.find(a => a.id === task.activityId);


    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Привязка:</span>
             {currentCampaign || currentAction || currentActivity ? (
                <div className="flex flex-wrap items-center gap-1">
                    {currentCampaign && <Badge variant="secondary">{currentCampaign.name}</Badge>}
                    {currentAction && <Badge variant="secondary">{currentAction.name}</Badge>}
                    {currentActivity && <Badge variant="secondary">{currentActivity.name}</Badge>}
                </div>
            ) : (
                 <span className="text-sm text-muted-foreground">Нет</span>
            )}
             <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                        <LinkIcon className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                    <form onSubmit={handleSubmit}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Изменить привязку</h4>
                                <p className="text-sm text-muted-foreground">
                                    Привяжите задачу к кампании, акции или активности.
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <div className="grid grid-cols-1 items-center gap-2">
                                    <Label>Кампания</Label>
                                    <Select name="campaignId" value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                                        <SelectTrigger><SelectValue placeholder="Выберите кампанию" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Нет</SelectItem>
                                            {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-1 items-center gap-2">
                                    <Label>Акция</Label>
                                    <Select name="actionId" value={selectedActionId} onValueChange={setSelectedActionId} disabled={!actions.length}>
                                        <SelectTrigger><SelectValue placeholder="Выберите акцию" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Нет</SelectItem>
                                            {actions.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="grid grid-cols-1 items-center gap-2">
                                    <Label>Активность</Label>
                                    <Select name="activityId" value={selectedActivityId} onValueChange={setSelectedActivityId} disabled={!activities.length}>
                                        <SelectTrigger><SelectValue placeholder="Выберите активность" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Нет</SelectItem>
                                            {activities.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                             <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Сохранение...</> : <><Save className="mr-2 h-4 w-4"/>Сохранить</>}
                            </Button>
                        </div>
                    </form>
                </PopoverContent>
            </Popover>
        </div>
    );
}
