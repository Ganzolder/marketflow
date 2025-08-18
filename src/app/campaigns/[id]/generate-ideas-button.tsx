
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Loader2, Wand2, Sparkles, Lightbulb, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Campaign } from '@/lib/types';
import { generateActionIdeas, type GenerateActionIdeasState } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export function GenerateIdeasButton({ campaign }: { campaign: Campaign }) {
    const [open, setOpen] = useState(false);
    const [state, setState] = useState<GenerateActionIdeasState>({ status: 'idle' });
    const { toast } = useToast();

    const handleAnalysis = async () => {
        setState({ status: 'loading' });
        const result = await generateActionIdeas(campaign);
        setState(result);

        if (result.status === 'error') {
            toast({
                variant: 'destructive',
                title: 'Ошибка генерации идей',
                description: result.error
            });
        }
    }

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            setState({ status: 'idle' });
        }
    }
    
    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Идеи от ИИ
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="text-primary" />
                        Генератор идей для кампании: {campaign.name}
                    </DialogTitle>
                    <DialogDescription>
                        Искусственный интеллект проанализирует цели и текущие акции, чтобы предложить улучшения и новые идеи.
                    </DialogDescription>
                </DialogHeader>

                {state.status === 'idle' && (
                    <div className="py-8 text-center">
                        <Button onClick={handleAnalysis}>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Начать анализ
                        </Button>
                    </div>
                )}
                
                {state.status === 'loading' && (
                     <div className="flex flex-col items-center justify-center gap-4 py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Анализирую кампанию... Это может занять до 30 секунд.</p>
                    </div>
                )}

                {state.status === 'success' && state.ideas && (
                    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4 -mr-2">
                        {state.ideas.recommendationsForExisting.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center">
                                    <Lightbulb className="mr-2 h-5 w-5 text-yellow-500"/>
                                    Рекомендации по текущим акциям
                                </h4>
                                <ul className="list-disc list-inside text-sm space-y-2 pl-2">
                                    {state.ideas.recommendationsForExisting.map((rec, i) => <li key={i}>{rec}</li>)}
                                </ul>
                            </div>
                        )}

                        <Separator />
                        
                        <div className="space-y-4">
                            <h4 className="font-semibold flex items-center">
                                <PlusCircle className="mr-2 h-5 w-5 text-green-500"/>
                                Новые идеи для акций
                            </h4>
                            {state.ideas.newActionIdeas.map((idea, i) => (
                                <Alert key={i} className="bg-muted/50">
                                    <AlertTitle>{idea.name}</AlertTitle>
                                    <AlertDescription>
                                        <p>{idea.description}</p>
                                        <p className="text-xs text-muted-foreground mt-2"><strong>ЦА:</strong> {idea.targetAudience}</p>
                                    </AlertDescription>
                                </Alert>
                            ))}
                        </div>
                    </div>
                )}
                
                <DialogFooter className="pt-4 border-t">
                    <DialogClose asChild>
                        <Button variant="outline">Закрыть</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
