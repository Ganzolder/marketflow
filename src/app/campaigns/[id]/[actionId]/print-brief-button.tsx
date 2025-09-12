
"use client";

import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Printer, ClipboardList } from "lucide-react";
import type { Action, Campaign, SocialPost } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

function PrintContent({ action, campaign, socialPosts }: { action: Action, campaign: Campaign, socialPosts: SocialPost[] }) {
    const formatDate = (dateString: string) => {
        if (!dateString) return '__________';
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
    
    const promoCodes: { [code: string]: string[] } = {};

    socialPosts.forEach(post => {
        if (post.promoCodes) {
            Object.entries(post.promoCodes).forEach(([platform, code]) => {
                if (!promoCodes[code]) {
                    promoCodes[code] = [];
                }
                if (!promoCodes[code].includes(platform)) {
                    promoCodes[code].push(platform);
                }
            });
        }
    });

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
                    .page-break {
                        page-break-before: always;
                    }
                     .prose {
                        max-width: 100%;
                    }
                    .prose h1, .prose h2, .prose h3, .prose h4 {
                        color: black;
                    }
                     .prose p, .prose li, .prose dt, .prose dd {
                        color: #333;
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
                `}
            </style>
            <div className="print-content font-serif text-sm">
                <div className="flex justify-end mb-8">
                    <div className="text-right">
                        <p>Утверждаю</p>
                        <p>_____________________</p>
                        <p className="mt-2">(Подпись руководителя)</p>
                    </div>
                </div>

                <h1 className="text-xl font-bold text-center mb-2">Бриф для исполнителей</h1>
                <h2 className="text-lg text-center mb-6">Маркетинговая акция: "{action.name}"</h2>
                <p className="text-center text-xs mb-6">Период проведения: {formatDate(action.startDate)} - {formatDate(action.endDate)}</p>

                <div className="space-y-6">
                    {action.description && (
                         <div>
                            <h3 className="font-bold text-base mt-4 mb-2 border-b pb-1">Описание акции</h3>
                            <p className="whitespace-pre-wrap">{action.description}</p>
                        </div>
                    )}
                    
                     {action.conditions && (
                        <div>
                            <h3 className="font-bold text-base mt-4 mb-2 border-b pb-1">Условия проведения</h3>
                            <div className="whitespace-pre-wrap prose prose-sm">{action.conditions}</div>
                        </div>
                    )}

                    {action.mechanics && (
                        <div>
                            <h3 className="font-bold text-base mt-4 mb-2 border-b pb-1">Механика акции</h3>
                             <div className="whitespace-pre-wrap prose prose-sm">{action.mechanics}</div>
                        </div>
                    )}

                    {(action.activities && action.activities.length > 0) && (
                        <div>
                            <h3 className="font-bold text-base mt-4 mb-2 border-b pb-1">Активности и способы отслеживания</h3>
                            <div className="prose prose-sm space-y-3">
                                {action.activities.map(activity => (
                                    <div key={activity.id}>
                                        <dt className="font-semibold">{activity.name}</dt>
                                        <dd>Способ отслеживания: {activity.trackingMethod || 'Не указан'}</dd>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-16 grid grid-cols-2 gap-8 text-xs">
                    <div>
                        <p>Ответственный за акцию:</p>
                        <p className="mt-4">_________________ / {action.responsiblePerson || '____________________'}</p>
                    </div>
                    <div>
                        <p>Дата составления:</p>
                        <p className="mt-4">{new Date().toLocaleDateString('ru-RU')}</p>
                    </div>
                </div>
            </div>

            {Object.keys(promoCodes).length > 0 && (
                <div className="page-break">
                    <div className="print-content font-serif text-sm min-h-[90vh] flex flex-col">
                        <h2 className="text-lg font-bold text-center my-6">Приложение: Промокоды</h2>
                        <div className="flex-1">
                            <table className="print-table">
                                <thead>
                                    <tr>
                                        <th className="w-1/3">Промокод</th>
                                        <th>Каналы распространения</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(promoCodes).map(([code, platforms]) => (
                                        <tr key={code}>
                                            <td className="p-4 text-2xl font-mono font-bold text-center align-middle">{code}</td>
                                            <td className="p-4 align-middle">{platforms.join(', ')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-center mt-4">Не забудьте зафиксировать использованный промокод при оформлении продажи/услуги.</p>
                    </div>
                </div>
            )}

        </div>
    );
};


export function PrintBriefButton({ action, campaign, socialPosts, asChild = true }: { action: Action, campaign: Campaign, socialPosts: SocialPost[], asChild?: boolean }) {
    const componentRef = useRef<HTMLDivElement>(null);
    
    const handlePrint = () => {
        const contentToPrint = componentRef.current?.innerHTML;
        if (contentToPrint) {
            const printWindow = window.open('', '_blank', 'height=800,width=800');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Печать брифа</title>');
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
            <ClipboardList className="mr-2 h-4 w-4" />
            Бриф для исполнителей
        </Button>
    );

    return (
        <Dialog>
            <DialogTrigger asChild>
                {TriggerButton}
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Предварительный просмотр: Бриф для исполнителей</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 -mx-6">
                    <div className="px-6 bg-gray-200">
                        {/* The component to be printed */}
                        <div ref={componentRef}>
                            <PrintContent action={action} campaign={campaign} socialPosts={socialPosts} />
                        </div>
                    </div>
                </ScrollArea>
                 <DialogFooter className="mt-4 shrink-0">
                    <DialogClose asChild>
                        <Button variant="outline">Закрыть</Button>
                    </DialogClose>
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Печать
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
