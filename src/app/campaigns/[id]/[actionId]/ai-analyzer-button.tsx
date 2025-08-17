

"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Loader2, Wand2, Sparkles, CheckCircle2, AlertTriangle, Lightbulb, Share2, MessageSquarePlus, PenLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Action, Campaign, AiSocialPost } from '@/lib/types';
import { analyzeAction, type AnalyzeActionState } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export function AiAnalyzerButton({ action, campaign, socialPosts, asChild = true }: { action: Action, campaign: Campaign, socialPosts: AiSocialPost[], asChild?: boolean }) {
    const [open, setOpen] = useState(false);
    const [state, setState] = useState<AnalyzeActionState>({ status: 'idle' });
    const { toast } = useToast();

    const handleAnalysis = async () => {
        setState({ status: 'loading' });
        const result = await analyzeAction(action, campaign, socialPosts);
        setState(result);

        if (result.status === 'error') {
            toast({
                variant: 'destructive',
                title: 'Ошибка анализа',
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
    
    const TriggerButton = (
        <Button variant={asChild ? "ghost" : "outline"} className={asChild ? "w-full justify-start p-2 h-auto" : ""}>
            <Wand2 className="mr-2 h-4 w-4" />
            AI Анализ
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {TriggerButton}
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="text-primary" />
                        AI Анализ Акции: {action.name}
                    </DialogTitle>
                    <DialogDescription>
                        Искусственный интеллект анализирует данные и дает рекомендации.
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
                        <p className="text-muted-foreground">Анализирую данные... Это может занять до 30 секунд.</p>
                    </div>
                )}

                {state.status === 'success' && state.analysis && (
                    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4 -mr-2">
                        <Alert>
                            <Lightbulb className="h-4 w-4" />
                            <AlertTitle>Общая оценка</AlertTitle>
                            <AlertDescription>{state.analysis.overallAssessment}</AlertDescription>
                        </Alert>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center text-green-600">
                                    <CheckCircle2 className="mr-2 h-5 w-5"/>
                                    Положительные моменты
                                </h4>
                                <ul className="list-disc list-inside text-sm space-y-1 pl-2">
                                    {state.analysis.positivePoints.map((point, i) => <li key={i}>{point}</li>)}
                                </ul>
                            </div>
                             <div className="space-y-2">
                                <h4 className="font-semibold flex items-center text-yellow-600">
                                    <AlertTriangle className="mr-2 h-5 w-5"/>
                                    Зоны для улучшения
                                </h4>
                                <ul className="list-disc list-inside text-sm space-y-1 pl-2">
                                    {state.analysis.areasForImprovement.map((point, i) => <li key={i}>{point}</li>)}
                                </ul>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">Рекомендации к действию</h4>
                            <div className="space-y-4">
                                {state.analysis.actionableSuggestions.map((sugg, i) => (
                                    <div key={i} className="p-3 bg-muted/50 rounded-lg text-sm">
                                        <p className="font-semibold">{sugg.suggestion}</p>
                                        <p className="text-muted-foreground text-xs mt-1">{sugg.rationale}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                         {state.analysis.smmAnalysis && (
                            <>
                                <Separator />
                                <div className="space-y-4">
                                     <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Share2 className="w-5 h-5 text-primary"/>
                                        Анализ SMM
                                    </h3>
                                    <Alert variant="default" className="bg-muted/50">
                                        <PenLine className="h-4 w-4" />
                                        <AlertTitle>Оценка SMM-плана</AlertTitle>
                                        <AlertDescription>{state.analysis.smmAnalysis.assessment}</AlertDescription>
                                    </Alert>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <h4 className="font-semibold flex items-center">
                                                <MessageSquarePlus className="mr-2 h-5 w-5"/>
                                                Идеи для новых постов
                                            </h4>
                                            <ul className="list-disc list-inside text-sm space-y-1 pl-2">
                                                {state.analysis.smmAnalysis.newIdeas.map((idea, i) => <li key={i}>{idea}</li>)}
                                            </ul>
                                        </div>
                                         <div className="space-y-2">
                                            <h4 className="font-semibold flex items-center">
                                                <Wand2 className="mr-2 h-5 w-5"/>
                                                Улучшения для текущих постов
                                            </h4>
                                            <ul className="list-disc list-inside text-sm space-y-1 pl-2">
                                                {state.analysis.smmAnalysis.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </>
                         )}
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
