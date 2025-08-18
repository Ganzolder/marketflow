

"use client";

import { useState, useEffect, useRef, useTransition, useActionState } from 'react';
import type { SocialPostStatus, Campaign, Action } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { addSocialPost, type SocialPostFormState, generatePostTextAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { SocialPlatforms } from '@/lib/types';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Loader2, PlusCircle, Wand2 } from 'lucide-react';
import { getCampaigns } from '@/lib/data';

const statusTranslations: Record<SocialPostStatus, string> = {
  draft: "Черновик",
  ready: "Готово",
  published: "Опубликован",
};

export function AddSmmPostButton() {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const textRef = useRef<HTMLTextAreaElement>(null);
    const [isPending, startTransition] = useTransition();
    
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState('');
    const [actionsForCampaign, setActionsForCampaign] = useState<Action[]>([]);
    
    const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);

    const [aiTopic, setAiTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    const initialState: SocialPostFormState = { message: "", errors: {} };
    const [state, dispatch] = useActionState(addSocialPost, initialState);

    useEffect(() => {
        if(open) {
            getCampaigns().then(setCampaigns);
        }
    }, [open]);

    useEffect(() => {
        if (state.message) {
            if (state.error) {
                const errorMessages = state.errors ? Object.values(state.errors).flat().join("\n") : state.message;
                toast({ variant: "destructive", title: "Ошибка", description: errorMessages });
            } else {
                toast({ title: "Успех", description: state.message });
                setOpen(false);
                formRef.current?.reset();
                setSelectedPlatforms([]);
                setAiTopic('');
                setSelectedCampaignId('');
                setActionsForCampaign([]);
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
            const result = await generatePostTextAction({
                topic: aiTopic,
                productName: 'наш продукт',
                targetAudience: 'широкая аудитория',
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
        setSelectedCampaignId(campaignId);
        const campaign = campaigns.find(c => c.id === campaignId);
        setActionsForCampaign(campaign?.actions || []);
    };


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Запланировать пост
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl h-screen flex flex-col sm:h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Запланировать новый пост</DialogTitle>
                    <DialogDescription>
                        Заполните детали поста.
                    </DialogDescription>
                </DialogHeader>
                <form ref={formRef} onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    <ScrollArea className="flex-1 pr-6 -mr-6">
                        <div className="grid gap-4 py-4 pr-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="grid gap-2">
                                    <Label htmlFor="campaignId">Кампания (необязательно)</Label>
                                    <Select name="campaignId" onValueChange={handleCampaignChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите кампанию" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {campaigns.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="actionId">Акция (необязательно)</Label>
                                    <Select name="actionId" disabled={!selectedCampaignId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите акцию" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {actionsForCampaign.map(a => (
                                                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
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
                                <Input id="title" name="title" placeholder="Краткий и броский заголовок для поста"/>
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
                                <Textarea ref={textRef} id="text" name="text" placeholder="Напишите текст вашего поста или сгенерируйте с помощью ИИ..." rows={6} />
                                {state.errors?.text && <p className="text-sm text-destructive">{state.errors.text[0]}</p>}
                            </div>
                             <div className="grid gap-2">
                                <Label>Плановые показатели</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="grid gap-1.5">
                                      <Label htmlFor="plannedReach" className="text-xs">Охват</Label>
                                      <Input id="plannedReach" name="plannedReach" type="number" placeholder="8000" />
                                    </div>
                                    <div className="grid gap-1.5">
                                      <Label htmlFor="plannedComments" className="text-xs">Комментарии</Label>
                                      <Input id="plannedComments" name="plannedComments" type="number" placeholder="50" />
                                    </div>
                                </div>
                                 {state.errors?.plannedReach && <p className="text-sm text-destructive">{state.errors.plannedReach[0]}</p>}
                                {state.errors?.plannedComments && <p className="text-sm text-destructive">{state.errors.plannedComments[0]}</p>}
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="publicationDate">Дата публикации</Label>
                                    <Input id="publicationDate" name="publicationDate" type="date" />
                                    {state.errors?.publicationDate && <p className="text-sm text-destructive">{state.errors.publicationDate[0]}</p>}
                                </div>
                                 <div className="grid gap-2">
                                    <Label htmlFor="status">Статус</Label>
                                    <Select name="status" defaultValue="draft">
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
                    <DialogFooter className="border-t pt-4 mt-auto shrink-0">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Отмена</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Добавление...</> : 'Добавить пост'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
