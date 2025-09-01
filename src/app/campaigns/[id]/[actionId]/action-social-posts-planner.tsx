

"use client";

import { useState, useActionState, useRef, useTransition, useEffect, useMemo } from 'react';
import type { Action, Activity, SocialPostStatus, SocialPlatform, SocialPost } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Share2, PlusCircle, Loader2, Save, MessageSquare, Users, ArrowUp, ArrowDown, Minus, Wand2, Info, ChevronDown, ArrowUpNarrowWide, ArrowDownNarrowWide } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { addSocialPost, type SocialPostFormState, type SocialPostMetricsFormState, updateSocialPostMetrics, generatePostTextAction } from '@/lib/actions';
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { EditSocialPostButton } from './edit-social-post-button';
import { DeleteSocialPostButton } from './delete-social-post-button';
import { useFormStatus } from 'react-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { UpdateSocialPostStatus } from '@/app/smm/update-social-post-status';
import { PublicationCalendar } from '@/app/smm/publication-calendar';
import { GeneratePostsSeriesButton } from './generate-posts-series-button';


const statusTranslations: Record<SocialPostStatus, string> = {
  draft: "Черновик",
  ready: "Готово",
  published: "Опубликован",
};

const AddSocialPostButton = ({ action, campaignId }: { action: Action, campaignId: string }) => {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const textRef = useRef<HTMLTextAreaElement>(null);
    const [isPending, startTransition] = useTransition();
    const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
    
    const [aiTopic, setAiTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    const initialState: SocialPostFormState = { message: "", errors: {} };
    const [state, dispatch] = useActionState(addSocialPost, initialState);

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
                productName: action.name,
                targetAudience: action.targetAudience || 'широкая аудитория',
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Добавить пост
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl h-screen flex flex-col sm:h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Запланировать новый пост</DialogTitle>
                    <DialogDescription>
                        Заполните детали поста для акции.
                    </DialogDescription>
                </DialogHeader>
                <form ref={formRef} onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    <ScrollArea className="flex-1 pr-6 -mr-6">
                        <div className="grid gap-4 py-4 pr-6">
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

function MetricsUpdateButton() {
    const { pending } = useFormStatus();
    return (
        <Button size="sm" type="submit" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        </Button>
    )
}

const StatDisplay = ({ label, plan, fact, locale }: { label: string, plan: number, fact: number | undefined, locale: string }) => {
    const factValue = fact || 0;
    const difference = factValue - plan;
    const isOver = difference > 0;
    const isUnder = difference < 0;
    const isEqual = difference === 0;

    return (
        <div className="text-center">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-semibold text-base">{factValue.toLocaleString(locale)}</p>
            <p className={`text-xs font-mono flex items-center justify-center ${isOver ? 'text-green-600' : isUnder ? 'text-red-500' : 'text-muted-foreground'}`}>
                {isOver && <ArrowUp className="w-3 h-3" />}
                {isUnder && <ArrowDown className="w-3 h-3" />}
                {isEqual && <Minus className="w-3 h-3" />}
                <span className="ml-1">{difference.toLocaleString(locale)}</span>
            </p>
        </div>
    )
}

function ActualMetricsForm({ post, actionId, campaignId }: { post: any, actionId: string, campaignId: string }) {
    const initialState: SocialPostMetricsFormState = { message: "", errors: {} };
    const [state, formAction] = useActionState(updateSocialPostMetrics, initialState);
    const { toast } = useToast();

    useEffect(() => {
        if (state.message) {
            if (state.error) {
                const errorMessages = state.errors ? Object.values(state.errors).flat().join("\n") : state.message;
                toast({ variant: "destructive", title: "Ошибка", description: errorMessages });
            } else {
                toast({ title: "Успех", description: state.message });
            }
        }
    }, [state, toast]);

    return (
        <form action={formAction} className="flex-1 space-y-4">
             <input type="hidden" name="postId" value={post.id} />
             <input type="hidden" name="campaignId" value={campaignId} />
             <input type="hidden" name="actionId" value={actionId} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Label className="text-xs text-muted-foreground">План. охват: {(post.plannedReach || 0).toLocaleString('ru-RU')}</Label>
                     <div className="relative mt-1">
                        <Users className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="number" name="actualReach" defaultValue={post.actualReach || ''} placeholder="Факт. охват" className="pl-8"/>
                    </div>
                    {state.errors?.actualReach && <p className="text-destructive text-xs mt-1">{state.errors.actualReach[0]}</p>}
                </div>
                 <div>
                    <Label className="text-xs text-muted-foreground">План. коммент.: {(post.plannedComments || 0).toLocaleString('ru-RU')}</Label>
                     <div className="relative mt-1">
                        <MessageSquare className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="number" name="actualComments" defaultValue={post.actualComments || ''} placeholder="Факт. коммент." className="pl-8" />
                    </div>
                     {state.errors?.actualComments && <p className="text-destructive text-xs mt-1">{state.errors.actualComments[0]}</p>}
                </div>
            </div>
             <div className="flex justify-end">
                <MetricsUpdateButton />
            </div>
        </form>
    );
}

export function ActionSocialPostsPlanner({ action, campaignId, posts, allPosts }: { action: Action, campaignId: string, posts: SocialPost[], allPosts: SocialPost[] }) {
  const locale = 'ru-RU';
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const getActivityName = (activityId?: string) => {
    if (!activityId || activityId === 'general') return 'Общий пост';
    return (action.activities || []).find(a => a.id === activityId)?.name || 'Неизвестная активность';
  }
  
  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const dateA = new Date(a.publicationDate).getTime();
      const dateB = new Date(b.publicationDate).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [posts, sortOrder]);


  return (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Поддержка в соцсетях</CardTitle>
                <CardDescription>План постов для продвижения акции.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <GeneratePostsSeriesButton action={action} campaignId={campaignId} />
                <AddSocialPostButton action={action} campaignId={campaignId} />
            </div>
        </CardHeader>
        <CardContent>
            {posts.length > 0 && (
                <div className="mb-8">
                    <PublicationCalendar posts={posts} allPosts={allPosts} />
                </div>
            )}
            {posts.length > 1 && (
                 <div className="flex justify-end gap-2 mb-4">
                    <Button variant={sortOrder === 'desc' ? 'secondary' : 'ghost'} size="icon" onClick={() => setSortOrder('desc')} className="h-8 w-8">
                        <ArrowDownNarrowWide className="h-4 w-4" />
                        <span className="sr-only">Сортировать по убыванию</span>
                    </Button>
                    <Button variant={sortOrder === 'asc' ? 'secondary' : 'ghost'} size="icon" onClick={() => setSortOrder('asc')} className="h-8 w-8">
                        <ArrowUpNarrowWide className="h-4 w-4" />
                        <span className="sr-only">Сортировать по возрастанию</span>
                    </Button>
                </div>
            )}
             <div className="grid gap-4 md:grid-cols-2">
                {sortedPosts.length > 0 ? (
                    sortedPosts.map(post => (
                        <Card key={post.id} className="overflow-hidden">
                           <CardHeader className="flex flex-row items-start justify-between gap-4 p-4 bg-muted/50">
                             <div>
                               <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold">{post.title}</p>
                                    <UpdateSocialPostStatus post={post} />
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {post.platforms.map((p: SocialPlatform) => <Badge key={p} variant="secondary">{p}</Badge>)}
                                </div>
                                <p className="text-sm font-medium mt-2">{new Date(post.publicationDate).toLocaleDateString(locale, {day: '2-digit', month: 'long', year: 'numeric'})}</p>
                                <Badge variant="outline" className="text-xs mt-2">{getActivityName(post.activityId)}</Badge>
                             </div>
                              <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center">
                                       <EditSocialPostButton post={post} />
                                       <DeleteSocialPostButton postId={post.id} campaignId={campaignId} actionId={action.id} />
                                    </div>
                               </div>
                           </CardHeader>
                           <CardContent className="p-4">
                             <Collapsible>
                                <CollapsibleTrigger asChild>
                                    <Button variant="link" size="sm" className="p-0 h-auto text-muted-foreground group">
                                        Показать/скрыть текст поста
                                        <ChevronDown className="h-4 w-4 ml-1 transition-transform group-data-[state=open]:rotate-180" />
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pt-2">
                                    <p className="text-sm text-foreground whitespace-pre-wrap">{post.text}</p>
                                </CollapsibleContent>
                             </Collapsible>
                           </CardContent>
                           <CardFooter className="bg-muted/50 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid grid-cols-2 gap-4 items-center">
                                  <StatDisplay label="Охват" plan={post.plannedReach} fact={post.actualReach} locale={locale} />
                                  <StatDisplay label="Комментарии" plan={post.plannedComments} fact={post.actualComments} locale={locale} />
                                </div>
                                <ActualMetricsForm post={post} actionId={action.id} campaignId={campaignId} />
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="text-center text-sm text-muted-foreground py-10 border-2 border-dashed rounded-lg md:col-span-2">
                        <Share2 className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p>Запланированные посты еще не добавлены.</p>
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
  );
}
