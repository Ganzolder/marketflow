
"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Printer, LocateFixed, Wand2, Loader2 } from "lucide-react";
import type { Action, SocialPost } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { analyzeTrackingMethodsAction, type AnalyzeTrackingState } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function PrintContent({ analysisResult }: { analysisResult: AnalyzeTrackingState }) {
    return (
        <div className="print-container p-8 bg-white text-black">
            <style type="text/css" media="print">
                {`
                    @page { 
                        size: auto;
                        margin: 20mm;
                    }
                    body {
                        background-color: #fff !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-container {
                        padding: 0 !important;
                        margin: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    .print-table {
                        width: 100%;
                        border-collapse: collapse;
                        border: 1px solid black;
                        font-size: 10px;
                    }
                    .print-table th, .print-table td {
                        border: 1px solid black;
                        padding: 8px;
                        text-align: left;
                        vertical-align: top;
                    }
                    .print-table th {
                        background-color: #f2f2f2 !important;
                    }
                    .promo-code {
                        font-family: monospace;
                        font-size: 1.5em;
                        font-weight: bold;
                    }
                `}
            </style>
            <div className="print-content font-serif text-sm">
                <h1 className="text-xl font-bold text-center mb-6">Задачи по настройке отслеживания</h1>

                {analysisResult.status === 'success' && analysisResult.analysis ? (
                    <table className="print-table">
                        <thead>
                            <tr>
                                <th className="w-1/4">Промокод / Метод</th>
                                <th className="w-1/3">Где используется</th>
                                <th>Рекомендация (Что сделать)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analysisResult.analysis.analysis.map((item, index) => (
                                <tr key={index}>
                                    <td className="promo-code">{item.method}</td>
                                    <td>{item.usage}</td>
                                    <td>{item.recommendation}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>Нет данных для отображения.</p>
                )}
            </div>
        </div>
    );
};


export function PrintTrackingReportButton({ action, socialPosts, asChild = true }: { action: Action, socialPosts: SocialPost[], asChild?: boolean }) {
    const componentRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [state, setState] = useState<AnalyzeTrackingState>({ status: 'idle' });

    useEffect(() => {
        if (open && state.status === 'idle') {
            handleAnalysis();
        }
    }, [open]);

    const handleAnalysis = async () => {
        setState({ status: 'loading' });
        const result = await analyzeTrackingMethodsAction(action, socialPosts);
        setState(result);
    };
    
    const handlePrint = () => {
        const contentToPrint = componentRef.current?.innerHTML;
        if (contentToPrint) {
            const printWindow = window.open('', '_blank', 'height=800,width=800');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Отчет по отслеживанию</title>');
                const styles = Array.from(document.styleSheets)
                    .map(styleSheet => {
                        try {
                           return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
                        } catch (e) {
                           console.warn('Cannot access stylesheet rules:', e);
                           return '';
                        }
                    }).join('');
                
                printWindow.document.write('<style>');
                printWindow.document.write(styles);
                printWindow.document.write('body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }');
                printWindow.document.write('</style></head><body>');
                printWindow.document.write(contentToPrint);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }
        }
    };

    const TriggerButton = (
        <Button variant={asChild ? "ghost" : "outline"} className={asChild ? "w-full justify-start p-2 h-auto" : ""}>
            <LocateFixed className="mr-2 h-4 w-4" />
            Отчет по отслеживанию
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {TriggerButton}
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>AI-помощник по настройке отслеживания</DialogTitle>
                </DialogHeader>
                 <ScrollArea className="flex-1 -mx-6">
                    {state.status === 'loading' && (
                        <div className="flex flex-col items-center justify-center gap-4 py-12 h-full">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground">Анализирую методы отслеживания...</p>
                        </div>
                    )}
                    {state.status === 'error' && (
                         <div className="p-6">
                             <Alert variant="destructive">
                                <Wand2 className="h-4 w-4" />
                                <AlertTitle>Ошибка анализа</AlertTitle>
                                <AlertDescription>{state.error}</AlertDescription>
                            </Alert>
                         </div>
                    )}
                    {state.status === 'success' && state.analysis && (
                        <div className="px-6 bg-gray-200">
                            <div ref={componentRef}>
                                <PrintContent analysisResult={state} />
                            </div>
                        </div>
                    )}
                </ScrollArea>
                 <DialogFooter className="mt-4 shrink-0">
                    <DialogClose asChild>
                        <Button variant="outline">Закрыть</Button>
                    </DialogClose>
                    <Button onClick={handlePrint} disabled={state.status !== 'success'}>
                        <Printer className="mr-2 h-4 w-4" />
                        Печать
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
