

"use client";

import * as React from 'react';
import type { EnrichedSocialPost, SocialPost, SocialPostStatus, SocialPlatform, Campaign, Action } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { EditSocialPostButton } from '../campaigns/[id]/[actionId]/edit-social-post-button';
import { PublicationCalendar } from './publication-calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, MinusCircle, Trash2 } from 'lucide-react';
import { DeleteSocialPostButton } from '../campaigns/[id]/[actionId]/delete-social-post-button';
import { UpdateSocialPostStatus } from './update-social-post-status';

const statusTranslations: Record<SocialPostStatus, string> = {
  draft: "Черновик",
  ready: "Готово",
  published: "Опубликован",
};

function Filters({ campaigns }: { campaigns: Campaign[] }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const [actionsForCampaign, setActionsForCampaign] = useState<Action[]>([]);
    
    const selectedCampaignId = searchParams.get('campaignId') || 'all';

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

    const handleStatusChange = (status: string) => {
        router.push(pathname + '?' + createQueryString([{name: 'status', value: status}]));
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
                    <Select onValueChange={handleStatusChange} defaultValue={searchParams.get('status') || 'all'}>
                        <SelectTrigger id="status">
                            <SelectValue placeholder="Все статусы" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все статусы</SelectItem>
                            {Object.entries(statusTranslations).map(([status, translation]) => (
                                <SelectItem key={status} value={status}>
                                    {translation}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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

const PublicationMatrix = ({ posts }: { posts: SocialPost[] }) => {
    const { postsByDate, allPlatforms } = React.useMemo(() => {
        const postsByDate: Record<string, any> = {};
        const platformSet = new Set<SocialPlatform>();

        posts.forEach(post => {
            const dateKey = new Date(post.publicationDate).toISOString().split('T')[0];
            if (!postsByDate[dateKey]) {
                postsByDate[dateKey] = { date: post.publicationDate, platforms: {} };
            }
            (post.platforms || []).forEach(platform => {
                if (!postsByDate[dateKey].platforms[platform]) {
                    postsByDate[dateKey].platforms[platform] = [];
                }
                postsByDate[dateKey].platforms[platform].push(post.title);
                platformSet.add(platform);
            });
        });

        const allPlatforms = Array.from(platformSet).sort();
        return { postsByDate: Object.values(postsByDate).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()), allPlatforms };
    }, [posts]);

    if (posts.length === 0 || allPlatforms.length === 0) {
        return null;
    }

    return (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle>Матрица публикаций</CardTitle>
                <CardDescription>Обзор запланированных постов по датам и платформам.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Дата</TableHead>
                            {allPlatforms.map(platform => (
                                <TableHead key={platform} className="text-center">{platform}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {postsByDate.map(row => (
                            <TableRow key={row.date}>
                                <TableCell className="font-medium">{new Date(row.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}</TableCell>
                                {allPlatforms.map(platform => (
                                    <TableCell key={platform} className="text-center">
                                        {row.platforms[platform] ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                                        ) : (
                                            <MinusCircle className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};


export function SmmPlanner({ posts, campaigns }: { posts: EnrichedSocialPost[], campaigns: Campaign[] }) {
    const locale = 'ru-RU';

    return (
        <div>
            <Filters campaigns={campaigns} />

            <div className="mb-8">
              <PublicationCalendar posts={posts} />
            </div>

            <PublicationMatrix posts={posts} />

            <div className="space-y-4">
                {posts.map(post => {
                    
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
