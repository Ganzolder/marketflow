

"use client";

import { useState, useActionState, useRef, useTransition, useEffect } from 'react';
import type { Action, Activity, SocialPostStatus, SocialPlatform } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Share2, PlusCircle, Loader2 } from 'lucide-react';
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';


const statusTranslations: Record<SocialPostStatus, string> = {
  draft: "Черновик",
  ready: "Готово",
  published: "Опубликован",
};

const AddSocialPostButton = ({ action, campaignId }: { action: Action, campaignId: string }) => {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, startTransition] = useTransition();
    const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
    
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Запланировать пост
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Запланировать новый пост</DialogTitle>
                    <DialogDescription>
                        Заполните детали поста для акции.
                    </DialogDescription>
                </DialogHeader>
                <form ref={formRef} onSubmit={handleSubmit}>
                    <ScrollArea className="max-h-[70vh] p-1 pr-4 -mr-4">
                        <div className="grid gap-4 py-4 pr-4">
                            <div className="grid gap-2">
                                <Label htmlFor="activityId">Привязать к активности (необязательно)</Label>
                                <Select name="activityId">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Общий пост для акции" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">Общий пост для акции</SelectItem>
                                        {(action.activities || []).map(activity => (
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
                                <Textarea id="text" name="text" placeholder="Напишите текст вашего поста..." rows={6} />
                                {state.errors?.text && <p className="text-sm text-destructive">{state.errors.text[0]}</p>}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="plannedViews">План. просмотры</Label>
                                    <Input id="plannedViews" name="plannedViews" type="number" placeholder="10000" />
                                    {state.errors?.plannedViews && <p className="text-sm text-destructive">{state.errors.plannedViews[0]}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="plannedReach">План. охват</Label>
                                    <Input id="plannedReach" name="plannedReach" type="number" placeholder="8000" />
                                    {state.errors?.plannedReach && <p className="text-sm text-destructive">{state.errors.plannedReach[0]}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="plannedComments">План. комментарии</Label>
                                    <Input id="plannedComments" name="plannedComments" type="number" placeholder="50" />
                                    {state.errors?.plannedComments && <p className="text-sm text-destructive">{state.errors.plannedComments[0]}</p>}
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
                        <input type="hidden" name="campaignId" value={campaignId} />
                        <input type="hidden" name="actionId" value={action.id} />
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
    )
}


export function ActionSocialPostsPlanner({ action, campaignId }: { action: Action, campaignId: string }) {
  const locale = 'ru-RU';
  
  const getActivityName = (activityId?: string) => {
    if (!activityId) return 'Общий пост';
    return (action.activities || []).find(a => a.id === activityId)?.name || 'Неизвестная активность';
  }

  return (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Поддержка в соцсетях</CardTitle>
                <CardDescription>План постов для продвижения акции.</CardDescription>
            </div>
            <AddSocialPostButton action={action} campaignId={campaignId} />
        </CardHeader>
        <CardContent>
             <div className="space-y-4">
                {(action.socialPosts || []).length > 0 ? (
                    action.socialPosts.map(post => (
                        <div key={post.id} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-sm font-medium">{new Date(post.publicationDate).toLocaleDateString(locale, {day: '2-digit', month: 'long', year: 'numeric'})}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {post.platforms.map(p => <Badge key={p} variant="secondary">{p}</Badge>)}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                     <Badge variant="outline">{statusTranslations[post.status]}</Badge>
                                     <Badge variant="default" className="text-xs">{getActivityName(post.activityId)}</Badge>
                                </div>
                            </div>
                             <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.text}</p>
                             <div className="grid grid-cols-3 gap-4 text-xs mt-3 pt-3 border-t">
                                <div className="text-center">
                                    <p className="font-semibold">{post.plannedViews.toLocaleString(locale)}</p>
                                    <p className="text-muted-foreground">Просмотры</p>
                                </div>
                                 <div className="text-center">
                                    <p className="font-semibold">{post.plannedReach.toLocaleString(locale)}</p>
                                    <p className="text-muted-foreground">Охват</p>
                                </div>
                                 <div className="text-center">
                                    <p className="font-semibold">{post.plannedComments.toLocaleString(locale)}</p>
                                    <p className="text-muted-foreground">Комментарии</p>
                                </div>
                             </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-sm text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                        <Share2 className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p>Запланированные посты еще не добавлены.</p>
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
  );
}
