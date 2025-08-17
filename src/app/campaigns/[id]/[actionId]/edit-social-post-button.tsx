
"use client";

import { useState, useEffect, useRef, useActionState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Edit, Wand2 } from "lucide-react";
import { updateSocialPost, type SocialPostFormState, generatePostTextAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SocialPost, SocialPlatform, SocialPostStatus, Action, Campaign } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { SocialPlatforms } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { getCampaigns } from '@/lib/data';

const statusTranslations: Record<SocialPostStatus, string> = {
  draft: "Черновик",
  ready: "Готово",
  published: "Опубликован",
};


export function EditSocialPostButton({ post }: { post: SocialPost }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const textRef = useRef<HTMLTextAreaElement>(null);
    const [isPending, startTransition] = useTransition();
    
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState(post.campaignId || '');
    const [actionsForCampaign, setActionsForCampaign] = useState<Action[]>([]);
    const [selectedActionId, setSelectedActionId] = useState(post.actionId || '');
    const [selectedActivityId, setSelectedActivityId] = useState(post.activityId || '');


    const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(post.platforms || []);
    
    const [aiTopic, setAiTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const initialState: SocialPostFormState = { message: "", errors: {} };
    const [state, dispatch] = useActionState(updateSocialPost, initialState);

     useEffect(() => {
        if (open) {
            getCampaigns().then(data => {
                setCampaigns(data);
                if(post.campaignId) {
                    const initialCampaign = data.find(c => c.id === post.campaignId);
                    if (initialCampaign) {
                        setActionsForCampaign(initialCampaign.actions || []);
                    }
                }
            });
        }
    }, [open, post.campaignId]);
    
    useEffect(() => {
        if (state.message) {
            if (state.error && state.errors) {
                const errorMessages = Object.values(state.errors).flat().join("\n");
                toast({ variant: "destructive", title: "Ошибка валидации", description: errorMessages });
            } else if (state.error) {
                toast({ variant: "destructive", title: "Ошибка", description: state.message });
            }
             else {
                toast({ title: "Успех", description: state.message });
                setOpen(false);
            }
        }
    }, [state, toast]);

    const handleGenerateText = async () => {
        if (!aiTopic) {
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Пожалуйста, введите тему для генерации.'});
            return;
        }
        setIsGenerating(true);
        try {
            const currentAction = campaigns.find(c => c.id === selectedCampaignId)?.actions.find(a => a.id === selectedActionId);
            const result = await generatePostTextAction({
                topic: aiTopic,
                productName: currentAction?.name || 'наш продукт',
                targetAudience: currentAction?.targetAudience || 'широкая аудитория',
                tone: 'дружелюбный'
            });
            if (result.postText) {
                if (textRef.current) {
                    textRef.current.value = result.postText;
                }
            } else {
                 toast({ variant: 'destructive', title: 'Ошибка', description: result.message });
            }
        } catch(e) {
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось сгенерировать текст.'});
        } finally {
            setIsGenerating(false);
        }
    }


    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        selectedPlatforms.forEach(p => formData.append('platforms', p));
        startTransition(() => {
            dispatch(formData);
        });
    }

    const handleCampaignChange = (campaignId: string) => {
        const newCampaignId = campaignId === 'none' ? '' : campaignId;
        setSelectedCampaignId(newCampaignId);
        setSelectedActionId(''); // Reset action selection
        setSelectedActivityId(''); // Reset activity selection
        const campaign = campaigns.find(c => c.id === newCampaignId);
        setActionsForCampaign(campaign?.actions || []);
    };
    
    const handleActionChange = (actionId: string) => {
        const newActionId = actionId === 'none' ? '' : actionId;
        setSelectedActionId(newActionId);
        setSelectedActivityId('');
    };

    const currentAction = campaigns.find(c => c.id === selectedCampaignId)?.actions.find(a => a.id === selectedActionId);

    const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={stopPropagation}>
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col sm:h-auto sm:max-h-[85vh]" onClick={stopPropagation}>
                <DialogHeader>
                    <DialogTitle>Редактировать пост</DialogTitle>
                </DialogHeader>
                <form ref={formRef} onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    <ScrollArea className="flex-1 pr-6 -mr-6">
                        <div className="grid gap-4 py-4 pr-6">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="grid gap-2">
                                    <Label htmlFor="campaignId">Кампания (необязательно)</Label>
                                    <Select name="campaignId" onValueChange={handleCampaignChange} value={selectedCampaignId || 'none'}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите кампанию" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Без кампании</SelectItem>
                                            {campaigns.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="actionId">Акция (необязательно)</Label>
                                    <Select name="actionId" value={selectedActionId || 'none'} onValueChange={handleActionChange} disabled={!selectedCampaignId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите акцию" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Без акции</SelectItem>
                                            {actionsForCampaign.map(a => (
                                                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                           </div>
                           <div className="grid gap-2">
                                <Label htmlFor="activityId">Привязать к активности (необязательно)</Label>
                                <Select name="activityId" value={selectedActivityId || 'none'} onValueChange={setSelectedActivityId} disabled={!selectedActionId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Общий пост для акции" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Общий пост для акции</SelectItem>
                                        {(currentAction?.activities || []).map(activity => (
                                            <SelectItem key={activity.id} value={activity.id}>{activity.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Платформы</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start font-normal">
                                            {selectedPlatforms.length > 0 ? selectedPlatforms.join(', ') : 'Выберите платформы'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <div className="flex flex-col space-y-1 p-1">
                                            {SocialPlatforms.map(platform => (
                                                <Label key={platform} className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent/50 cursor-pointer">
                                                    <Checkbox
                                                        checked={selectedPlatforms.includes(platform)}
                                                        onCheckedChange={(checked) => {
                                                            return checked
                                                                ? setSelectedPlatforms(prev => [...prev, platform])
                                                                : setSelectedPlatforms(prev => prev.filter(p => p !== platform))
                                                        }}
                                                    />
                                                    <span>{platform}</span>
                                                </Label>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                {state.errors?.platforms && <p className="text-sm text-destructive">{state.errors.platforms[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="title">Заголовок</Label>
                                <Input id="title" name="title" defaultValue={post.title || ''} placeholder="Краткий и броский заголовок для поста"/>
                                {state.errors?.title && <p className="text-sm text-destructive">{state.errors.title[0]}</p>}
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="aiTopic">Тема для ИИ (генерирует только текст поста)</Label>
                                <div className="flex gap-2">
                                    <Input id="aiTopic" placeholder="напр., Скидки на летнюю коллекцию" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} />
                                    <Button type="button" variant="outline" onClick={handleGenerateText} disabled={isGenerating}>
                                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin"/> : <Wand2 className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="text">Текст поста</Label>
                                <Textarea ref={textRef} id="text" name="text" defaultValue={post.text || ''} rows={6} />
                                {state.errors?.text && <p className="text-sm text-destructive">{state.errors.text[0]}</p>}
                            </div>
                             <div className="grid gap-2">
                                <Label>Плановые показатели</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="plannedReach" className="text-xs">Охват</Label>
                                        <Input id="plannedReach" name="plannedReach" type="number" placeholder="Охват" defaultValue={post.plannedReach} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="plannedComments" className="text-xs">Комментарии</Label>
                                        <Input id="plannedComments" name="plannedComments" type="number" placeholder="Комментарии" defaultValue={post.plannedComments} />
                                    </div>
                                </div>
                                 {state.errors?.plannedReach && <p className="text-sm text-destructive">{state.errors.plannedReach[0]}</p>}
                                {state.errors?.plannedComments && <p className="text-sm text-destructive">{state.errors.plannedComments[0]}</p>}
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="publicationDate">Дата публикации</Label>
                                    <Input id="publicationDate" name="publicationDate" type="date" defaultValue={post.publicationDate} />
                                    {state.errors?.publicationDate && <p className="text-sm text-destructive">{state.errors.publicationDate[0]}</p>}
                                </div>
                                 <div className="grid gap-2">
                                    <Label htmlFor="status">Статус</Label>
                                    <Select name="status" defaultValue={post.status}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите статус"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(statusTranslations).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                     {state.errors?.status && <p className="text-sm text-destructive">{state.errors.status[0]}</p>}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="border-t pt-4 mt-auto">
                        <input type="hidden" name="postId" value={post.id} />
                        {/* Hidden inputs to carry over actual values */}
                        <input type="hidden" name="actualReach" value={post.actualReach || 0} />
                        <input type="hidden" name="actualComments" value={post.actualComments || 0} />
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Отмена</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Сохранение...</> : 'Сохранить изменения'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
