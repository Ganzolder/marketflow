
"use client";

import { useState, useRef, useTransition, useActionState } from 'react';
import type { SocialPost, SocialPostStatus, SocialPlatform, Campaign, Action } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Share2, PlusCircle, Loader2, Wand2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EditSocialPostButton } from './[actionId]/edit-social-post-button';
import { DeleteSocialPostButton } from './[actionId]/delete-social-post-button';
import Link from 'next/link';

const statusTranslations: Record<SocialPostStatus, string> = {
  draft: "Черновик",
  ready: "Готово",
  published: "Опубликован",
};

const statusStyles: Record<SocialPostStatus, string> = {
  draft: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700/50",
  ready: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50",
  published: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50",
};

const AddSocialPostToCampaignButton = ({ campaign }: { campaign: Campaign }) => {
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

    const handleGenerateText = async () => {
        if (!aiTopic) {
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Пожалуйста, введите тему для генерации.'});
            return;
        }
        setIsGenerating(true);
        try {
            const result = await generatePostTextAction({
                topic: aiTopic,
                productName: campaign.name,
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Запланировать пост
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl h-screen flex flex-col sm:h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Новый пост для кампании: {campaign.name}</DialogTitle>
                    <DialogDescription>
                        Заполните детали поста. Вы можете привязать его к акции.
                    </DialogDescription>
                </DialogHeader>
                <form ref={formRef} onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    <ScrollArea className="flex-1 pr-6 -mr-6">
                        <div className="grid gap-4 py-4 pr-6">
                            <input type="hidden" name="campaignId" value={campaign.id} />
                            <div className="grid gap-2">
                                <Label htmlFor="actionId">Привязать к акции (необязательно)</Label>
                                <Select name="actionId">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Без привязки к акции" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Без привязки к акции</SelectItem>
                                        {(campaign.actions || []).map(action => (
                                            <SelectItem key={action.id} value={action.id}>{action.name}</SelectItem>
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
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="title">Заголовок</Label>
                                <Input id="title" name="title" placeholder="Краткий и броский заголовок для поста"/>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="aiTopic">Тема для ИИ (генерирует только текст поста)</Label>
                                <div className="flex gap-2">
                                    <Input id="aiTopic" placeholder="напр., Подведение итогов летней распродажи" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} />
                                    <Button type="button" variant="outline" onClick={handleGenerateText} disabled={isGenerating}>
                                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin"/> : <Wand2 className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="text">Текст поста</Label>
                                <Textarea ref={textRef} id="text" name="text" placeholder="Напишите текст вашего поста или сгенерируйте с помощью ИИ..." rows={6} />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="publicationDate">Дата публикации</Label>
                                    <Input id="publicationDate" name="publicationDate" type="date" />
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
    )
}


export function CampaignSocialPostsCard({ campaign, posts }: { campaign: Campaign, posts: SocialPost[] }) {
  const locale = 'ru-RU';
  
  const sortedPosts = posts.sort((a,b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime());

  return (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Поддержка в соцсетях</CardTitle>
                <CardDescription>Посты, относящиеся ко всей кампании.</CardDescription>
            </div>
            <AddSocialPostToCampaignButton campaign={campaign} />
        </CardHeader>
        <CardContent>
             <div className="space-y-4">
                {sortedPosts.length > 0 ? (
                    sortedPosts.map(post => (
                        <Card key={post.id} className="overflow-hidden">
                           <CardHeader className="flex flex-row items-start justify-between gap-4 p-4 bg-muted/50">
                             <div>
                               <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold">{post.title}</p>
                                    <Badge variant="outline" className={statusStyles[post.status]}>{statusTranslations[post.status]}</Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {post.platforms.map((p: SocialPlatform) => <Badge key={p} variant="secondary">{p}</Badge>)}
                                </div>
                                <p className="text-sm font-medium mt-2">{new Date(post.publicationDate).toLocaleDateString(locale, {day: '2-digit', month: 'long', year: 'numeric'})}</p>
                                 {post.actionId && (
                                     <CardDescription className="text-xs mt-2">
                                        <Link href={`/campaigns/${campaign.id}/${post.actionId}`} className="hover:underline">
                                            Акция: {campaign.actions?.find(a => a.id === post.actionId)?.name || 'Неизвестная акция'}
                                        </Link>
                                     </CardDescription>
                                 )}
                             </div>
                              <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center">
                                       <EditSocialPostButton post={post} />
                                       <DeleteSocialPostButton postId={post.id} campaignId={campaign.id} actionId={post.actionId || ''} />
                                    </div>
                               </div>
                           </CardHeader>
                           <CardContent className="p-4">
                                <p className="text-sm text-foreground whitespace-pre-wrap">{post.text}</p>
                           </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center text-sm text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                        <Share2 className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p>Посты для этой кампании еще не добавлены.</p>
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
  );
}
