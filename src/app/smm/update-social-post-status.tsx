
"use client";

import { useActionState, useTransition, useEffect } from 'react';
import { updateSocialPostStatus, type SocialPostStatusFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SocialPost, SocialPostStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

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

export function UpdateSocialPostStatus({ post }: { post: SocialPost }) {
    const { toast } = useToast();
    const initialState: SocialPostStatusFormState = { message: "" };
    const [isPending, startTransition] = useTransition();

    const formAction = updateSocialPostStatus.bind(null);
    const [state, dispatch] = useActionState(formAction, initialState);

    useEffect(() => {
        if (state?.message) {
            if (state.error) {
                toast({
                    variant: "destructive",
                    title: "Ошибка",
                    description: state.message,
                });
            } else {
                toast({
                    title: "Успех",
                    description: state.message,
                });
            }
        }
    }, [state, toast]);

    const handleValueChange = (newStatus: SocialPostStatus) => {
        const formData = new FormData();
        formData.append('postId', post.id);
        formData.append('status', newStatus);
        
        startTransition(() => {
            dispatch(formData);
        });
    };

    const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <form onClick={stopPropagation}>
             <Select onValueChange={handleValueChange} value={post.status} disabled={isPending}>
                <SelectTrigger className="h-auto border-none p-0 bg-transparent w-auto focus:ring-0 focus:ring-offset-0 disabled:opacity-70 disabled:cursor-not-allowed [&_svg]:ml-1">
                    <SelectValue asChild>
                         <Badge variant="outline" className={statusStyles[post.status]}>
                            {statusTranslations[post.status]}
                        </Badge>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent onClick={stopPropagation}>
                    {Object.entries(statusTranslations).map(([status, translation]) => (
                         <SelectItem key={status} value={status}>{translation}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </form>
    );
}
