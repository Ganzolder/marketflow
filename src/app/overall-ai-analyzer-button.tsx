

"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Loader2, Wand2, Sparkles, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { analyzeOverallPerformance, type AnalyzeOverallState } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const priorityTranslations: Record<'high' | 'medium' | 'low', string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

const priorityStyles: Record<'high' | 'medium' | 'low', string> = {
  high: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50",
  low: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50",
};


export function OverallAiAnalyzerButton() {
    const [open, setOpen] = useState(false);
    const [state, setState] = useState<AnalyzeOverallState>({ status: 'idle' });
    const { toast } = useToast();

    const handleAnalysis = async () => {
        setState({ status: 'loading' });
        const result = await analyzeOverallPerformance();
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
                    Глобальный Анализ
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl h-screen flex flex-col sm:h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="text-primary" />
                        Глобальный AI Анализ
                    </DialogTitle>
                    <DialogDescription>
                        Искусственный интеллект анализирует все данные и дает стратегические рекомендации.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-6 -mr-6">
                    <div className="py-4 pr-6">
                        {state.status === 'idle' && (
                            <div className="py-12 text-center">
                                <Button size="lg" onClick={handleAnalysis}>
                                    <Wand2 className="mr-2 h-5 w-5" />
                                    Начать анализ
                                </Button>
                            </div>
                        )}
                        
                        {state.status === 'loading' && (
                            <div className="flex flex-col items-center justify-center gap-4 py-12">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="text-muted-foreground">Анализирую данные... Это может занять до минуты.</p>
                            </div>
                        )}

                        {state.status === 'success' && state.analysis && (
                            <div className="space-y-6">
                                <Alert>
                                    <Lightbulb className="h-4 w-4" />
                                    <AlertTitle>Краткое резюме</AlertTitle>
                                    <AlertDescription>{state.analysis.executiveSummary}</AlertDescription>
                                </Alert>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                                        <h4 className="font-semibold flex items-center text-green-600">
                                            <CheckCircle2 className="mr-2 h-5 w-5"/>
                                            Ключевые успехи
                                        </h4>
                                        <ul className="list-disc list-inside text-sm space-y-1 pl-2">
                                            {state.analysis.keySuccesses.map((point, i) => <li key={i}>{point}</li>)}
                                        </ul>
                                    </div>
                                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                                        <h4 className="font-semibold flex items-center text-yellow-600">
                                            <AlertTriangle className="mr-2 h-5 w-5"/>
                                            Ключевые вызовы
                                        </h4>
                                        <ul className="list-disc list-inside text-sm space-y-1 pl-2">
                                            {state.analysis.keyChallenges.map((point, i) => <li key={i}>{point}</li>)}
                                        </ul>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Стратегические рекомендации</h3>
                                    <div className="space-y-4">
                                        {state.analysis.strategicRecommendations.sort((a, b) => {
                                            const priorities = { high: 0, medium: 1, low: 2 };
                                            return priorities[a.priority] - priorities[b.priority];
                                        }).map((sugg, i) => (
                                            <div key={i} className="p-4 border rounded-lg text-sm">
                                                <div className="flex justify-between items-start gap-4">
                                                    <p className="font-semibold">{sugg.suggestion}</p>
                                                    <Badge className={priorityStyles[sugg.priority]}>{priorityTranslations[sugg.priority]}</Badge>
                                                </div>
                                                <p className="text-muted-foreground text-xs mt-1.5">{sugg.rationale}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                
                <DialogFooter className="pt-4 border-t mt-auto shrink-0">
                    <DialogClose asChild>
                        <Button variant="outline">Закрыть</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
