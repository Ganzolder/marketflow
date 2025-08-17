

"use client";

import { useState, useEffect, useRef, useActionState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Edit } from "lucide-react";
import { updateSocialPostInAction, type SocialPostFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SocialPost, SocialPlatform, SocialPostStatus, Activity } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { SocialPlatforms } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

const statusTranslations: Record<SocialPostStatus, string> = {
  draft: "Черновик",
  ready: "Готово",
  published: "Опубликован",
};


export function EditSocialPostButton({ post, actionId, campaignId, activities }: { post: SocialPost; actionId: string; campaignId: string; activities: Activity[] }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, startTransition] = useTransition();
    const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(post.platforms || []);
    
    const initialState: SocialPostFormState = { message: "", errors: {} };
    const [state, dispatch] = useActionState(updateSocialPostInAction, initialState);
    
    useEffect(() => {
        if (state.message) {
            if (state.error) {
                toast({ variant: "destructive", title: "Ошибка", description: state.message });
            } else {
                toast({ title: "Успех", description: state.message });
                setOpen(false);
            }
        }
    }, [state, toast]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        selectedPlatforms.forEach(p => formData.append('platforms', p));
        startTransition(() => {
            dispatch(formData);
        });
    }
    
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
                            <div className="grid gap-2">
                                <Label htmlFor="activityId">Привязка к активности</Label>
                                <Select name="activityId" defaultValue={post.activityId || 'general'}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Общий пост для акции" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">Общий пост для акции</SelectItem>
                                        {(activities || []).map(activity => (
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
                                <Label htmlFor="text">Текст поста</Label>
                                <Textarea id="text" name="text" defaultValue={post.text} rows={6} />
                                {state.errors?.text && <p className="text-sm text-destructive">{state.errors.text[0]}</p>}
                            </div>
                             <div className="grid gap-2">
                                <Label>Плановые показатели</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input name="plannedReach" type="number" placeholder="Охват" defaultValue={post.plannedReach} />
                                    <Input name="plannedComments" type="number" placeholder="Комментарии" defaultValue={post.plannedComments} />
                                </div>
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
                        <input type="hidden" name="campaignId" value={campaignId} />
                        <input type="hidden" name="actionId" value={actionId} />
                        <input type="hidden" name="postId" value={post.id} />
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
