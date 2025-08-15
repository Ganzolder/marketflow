
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Loader2, Wand2, Sparkles, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Action, Campaign } from '@/lib/types';
import { analyzeAction, type AnalyzeActionState } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export function AiAnalyzerButton({ action, campaign }: { action: Action, campaign: Campaign }) {
    const [open, setOpen] = useState(false);
    const [state, setState] = useState<AnalyzeActionState>({ status: 'idle' });
    const { toast } = useToast();

    const handleAnalysis = async () => {
        setState({ status: 'loading' });
        const result = await analyzeAction(action, campaign);
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

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Wand2 className="mr-2 h-4 w-4" />
                    AI Анализ
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
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
                    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4">
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
                    </div>
                )}
                
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Закрыть</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
