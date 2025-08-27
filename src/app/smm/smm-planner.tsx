

"use client";

import * as React from 'react';
import type { EnrichedSocialPost, SocialPost, SocialPostStatus, SocialPlatform, Campaign, Action } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { EditSocialPostButton } from '../campaigns/[id]/[actionId]/edit-social-post-button';
import { PublicationCalendar } from './publication-calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, MinusCircle, Trash2, ArrowUpNarrowWide, ArrowDownNarrowWide, ChevronRight } from 'lucide-react';
import { DeleteSocialPostButton } from '../campaigns/[id]/[actionId]/delete-social-post-button';
import { UpdateSocialPostStatus } from './update-social-post-status';
import { MultiSelect } from '@/components/ui/multi-select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const statusTranslations: Record<SocialPostStatus, string> = {
  draft: "Черновик",
  ready: "Готово",
  published: "Опубликован",
};

const statusOptions = Object.entries(statusTranslations).map(([value, label]) => ({ value, label }));


function Filters({ campaigns }: { campaigns: Campaign[] }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const [actionsForCampaign, setActionsForCampaign] = useState<Action[]>([]);
    
    const selectedCampaignId = searchParams.get('campaignId') || 'all';
    const selectedStatuses = useMemo(() => (searchParams.get('status') || 'planned,ready').split(','), [searchParams]);

    useEffect(() => {
        const campaign = campaigns.find(c => c.id === selectedCampaignId);
        setActionsForCampaign(campaign?.actions || []);
    }, [selectedCampaignId, campaigns]);
    
    const createQueryString = useCallback(
        (updates: { name: string; value: string }[]) => {
            const params = new URLSearchParams(searchParams.toString());
            updates.forEach(({ name, value }) => {
                if (value === 'all' || !value) {
                    params.delete(name);
                } else {
                    params.set(name, value);
                }
            });
            return params.toString();
        },
        [searchParams]
    );
    
    const handleCampaignChange = (campaignId: string) => {
        const newQueryString = createQueryString([
            { name: 'campaignId', value: campaignId },
            { name: 'actionId', value: 'all' } // Reset action when campaign changes
        ]);
        router.push(`${pathname}?${newQueryString}`);
    }
    
    const handleActionChange = (actionId: string) => {
        const newQueryString = createQueryString([{ name: 'actionId', value: actionId }]);
        router.push(`${pathname}?${newQueryString}`);
    }

    const handleStatusChange = (newStatuses: string[]) => {
        router.push(pathname + '?' + createQueryString([{name: 'status', value: newStatuses.join(',')}]));
    }

     const handleDateChange = (name: 'startDate' | 'endDate', value: string) => {
        router.push(pathname + '?' + createQueryString([{name, value}]));
    }

    return (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle>Фильтры</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="status">Статус</Label>
                    <MultiSelect
                        options={statusOptions}
                        selected={selectedStatuses}
                        onChange={handleStatusChange}
                        placeholder="Все статусы"
                    />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="startDate">Дата публикации от</Label>
                    <Input id="startDate" type="date" defaultValue={searchParams.get('startDate') || ''} onChange={e => handleDateChange('startDate', e.target.value)} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="endDate">Дата публикации до</Label>
                    <Input id="endDate" type="date" defaultValue={searchParams.get('endDate') || ''} onChange={e => handleDateChange('endDate', e.target.value)} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Кампания</Label>
                        <Select onValueChange={handleCampaignChange} value={selectedCampaignId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Все кампании" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все кампании</SelectItem>
                                {campaigns.map((campaign) => (
                                <SelectItem key={campaign.id} value={campaign.id}>
                                    {campaign.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Акция</Label>
                        <Select onValueChange={handleActionChange} value={searchParams.get('actionId') || 'all'} disabled={selectedCampaignId === 'all'}>
                            <SelectTrigger>
                                <SelectValue placeholder="Все акции" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все акции</SelectItem>
                                {actionsForCampaign.map((action) => (
                                <SelectItem key={action.id} value={action.id}>
                                    {action.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

const PublicationMatrix = ({ posts }: { posts: EnrichedSocialPost[] }) => {
    const { postsByDate } = React.useMemo(() => {
        const postsByDate: Record<string, EnrichedSocialPost[]> = {};
        posts.forEach(post => {
            const dateKey = new Date(post.publicationDate).toISOString().split('T')[0];
            if (!postsByDate[dateKey]) {
                postsByDate[dateKey] = [];
            }
            postsByDate[dateKey].push(post);
        });
        
        const sortedDates = Object.keys(postsByDate).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
        
        const sortedPostsByDate: Record<string, EnrichedSocialPost[]> = {};
        sortedDates.forEach(date => {
            sortedPostsByDate[date] = postsByDate[date];
        });

        return { postsByDate: sortedPostsByDate };
    }, [posts]);

    if (posts.length === 0) {
        return null;
    }
    
    const locale = 'ru-RU';

    return (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle>Матрица публикаций</CardTitle>
                <CardDescription>Обзор запланированных постов по датам.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" className="w-full space-y-2">
                    {Object.entries(postsByDate).map(([date, postsOnDate]) => (
                        <AccordionItem value={date} key={date} className="border rounded-md px-4">
                            <AccordionTrigger className="py-3 hover:no-underline">
                               <div className="flex-1 text-left flex items-center justify-between">
                                 <p className="font-semibold">{new Date(date).toLocaleDateString(locale, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</p>
                                 <Badge variant="secondary" className="mr-4">{postsOnDate.length} {postsOnDate.length === 1 ? 'пост' : (postsOnDate.length > 1 && postsOnDate.length < 5) ? 'поста' : 'постов'}</Badge>
                               </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4">
                                <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Заголовок</TableHead>
                                            <TableHead>Платформы</TableHead>
                                            <TableHead>Привязка</TableHead>
                                            <TableHead>Статус</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {postsOnDate.map(post => (
                                            <TableRow key={post.id}>
                                                <TableCell className="font-medium max-w-xs truncate">{post.title}</TableCell>
                                                <TableCell><div className="flex gap-1">{post.platforms.map(p => <Badge key={p} variant="outline">{p}</Badge>)}</div></TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        {post.campaignName && <span>{post.campaignName}</span>}
                                                        {post.actionName && <><ChevronRight className="w-3 h-3"/><span>{post.actionName}</span></>}
                                                        {post.activityName && <><ChevronRight className="w-3 h-3"/><span>{post.activityName}</span></>}
                                                    </div>
                                                </TableCell>
                                                <TableCell><UpdateSocialPostStatus post={post}/></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
};


export function SmmPlanner({ posts, campaigns }: { posts: EnrichedSocialPost[], campaigns: Campaign[] }) {
    const locale = 'ru-RU';
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const sortedPosts = useMemo(() => {
        return [...posts].sort((a, b) => {
            const dateA = new Date(a.publicationDate).getTime();
            const dateB = new Date(b.publicationDate).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
    }, [posts, sortOrder]);


    return (
        <div>
            <div className="mb-8">
              <PublicationCalendar posts={posts} />
            </div>

            <Accordion type="single" collapsible className="w-full mb-8">
                <AccordionItem value="item-1">
                    <AccordionTrigger>
                        <h3 className="text-lg font-medium">Матрица публикаций</h3>
                    </AccordionTrigger>
                    <AccordionContent>
                        <PublicationMatrix posts={posts} />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            
            <Filters campaigns={campaigns} />

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
                {sortedPosts.map(post => {
                    
                    return (
                     <Card key={post.id} className="overflow-hidden">
                        <CardHeader className="flex flex-row items-start justify-between gap-4 p-4 bg-muted/50">
                            <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold">{post.title}</p>
                                <UpdateSocialPostStatus post={post} />
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {(post.platforms || []).map(p => <Badge key={p} variant="secondary">{p}</Badge>)}
                            </div>
                            <p className="text-sm font-medium mt-2">{new Date(post.publicationDate).toLocaleDateString(locale, {day: '2-digit', month: 'long', year: 'numeric'})}</p>
                            <div className="text-xs mt-2 space-y-1">
                                {post.campaignName && (
                                    <CardDescription>
                                        <Link href={`/campaigns/${post.campaignId}`} className="hover:underline">
                                            Кампания: {post.campaignName}
                                        </Link>
                                    </CardDescription>
                                )}
                                {post.actionName && post.campaignId && post.actionId && (
                                    <CardDescription>
                                        <Link href={`/campaigns/${post.campaignId}/${post.actionId}`} className="hover:underline">
                                            Акция: {post.actionName}
                                        </Link>
                                    </CardDescription>
                                )}
                             </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center">
                                    <EditSocialPostButton 
                                        post={post}
                                    />
                                    <DeleteSocialPostButton postId={post.id} campaignId={post.campaignId || ''} actionId={post.actionId || ''} />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <p className="text-sm text-foreground whitespace-pre-wrap">{post.text}</p>
                        </CardContent>
                    </Card>
                )})}
            </div>
             {posts.length === 0 && (
                <Card>
                    <CardContent className="py-10 text-center text-muted-foreground">
                        Нет постов, соответствующих вашим фильтрам.
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
