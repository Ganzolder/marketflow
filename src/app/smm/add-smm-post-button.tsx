
"use client";

import { useState, useEffect, useRef, useTransition, useActionState } from 'react';
import type { Action, Campaign, SocialPlatform, SocialPostStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { addSocialPostToAction, type SocialPostFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { SocialPlatforms } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Loader2, PlusCircle } from 'lucide-react';

const statusTranslations: Record<SocialPostStatus, string> = {
  draft: "Черновик",
  ready: "Готово",
  published: "Опубликован",
};

export function AddSmmPostButton({ campaigns, actions }: { campaigns: Campaign[], actions: Action[] }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, startTransition] = useTransition();
    const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<string>('');
    const [filteredActions, setFilteredActions] = useState<Action[]>([]);
    
    const initialState: SocialPostFormState = { message: "", errors: {} };
    const [state, dispatch] = useActionState(addSocialPostToAction, initialState);

    useEffect(() => {
        if (state.message) {
            if (state.error) {
                toast({ variant: "destructive", title: "Ошибка", description: state.message });
            } else {
                toast({ title: "Успех", description: state.message });
                setOpen(false);
                formRef.current?.reset();
                setSelectedPlatforms([]);
                setSelectedCampaign('');
            }
        }
    }, [state, toast]);
    
    useEffect(() => {
        if (selectedCampaign) {
            setFilteredActions(actions.filter(a => a.campaignId === selectedCampaign));
        } else {
            setFilteredActions([]);
        }
    }, [selectedCampaign, actions]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        selectedPlatforms.forEach(p => formData.append('platforms', p));
        startTransition(() => {
            dispatch(formData);
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Запланировать пост
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Запланировать новый пост</DialogTitle>
                    <DialogDescription>
                        Заполните детали поста.
                    </DialogDescription>
                </DialogHeader>
                <form ref={formRef} onSubmit={handleSubmit}>
                    <ScrollArea className="max-h-[70vh] p-1 pr-4 -mr-4">
                        <div className="grid gap-4 py-4 pr-4">
                            <div className="grid grid-cols-2 gap-4">
                               <div className="grid gap-2">
                                    <Label htmlFor="campaignId">Кампания</Label>
                                    <Select name="campaignId" onValueChange={setSelectedCampaign}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите кампанию" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {campaigns.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                     {state.errors?.campaignId && <p className="text-sm text-destructive">{state.errors.campaignId[0]}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="actionId">Акция</Label>
                                    <Select name="actionId" disabled={!selectedCampaign}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите акцию" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredActions.map(a => (
                                                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {state.errors?.actionId && <p className="text-sm text-destructive">{state.errors.actionId[0]}</p>}
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
                                <Label htmlFor="text">Текст поста</Label>
                                <Textarea id="text" name="text" placeholder="Напишите текст вашего поста..." rows={6} />
                                {state.errors?.text && <p className="text-sm text-destructive">{state.errors.text[0]}</p>}
                            </div>
                             <div className="grid gap-2">
                                <Label>Плановые показатели</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input name="plannedReach" type="number" placeholder="Охват" />
                                    <Input name="plannedComments" type="number" placeholder="Комментарии" />
                                </div>
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
                    <DialogFooter className="border-t pt-4 mt-4">
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
