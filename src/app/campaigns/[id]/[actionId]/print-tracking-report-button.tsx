
"use client";

import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Printer, LocateFixed } from "lucide-react";
import type { Action, SocialPost } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

function PrintContent({ action, socialPosts }: { action: Action, socialPosts: SocialPost[] }) {
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

    const otherTrackingMethods = action.activities
        ?.map(a => a.trackingMethod)
        .filter((value, index, self) => value && self.indexOf(value) === index) || [];

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
                `}
            </style>
            <div className="print-content font-serif text-sm">
                <h1 className="text-xl font-bold text-center mb-2">Отчет по способам отслеживания</h1>
                <h2 className="text-lg text-center mb-6">Акция: "{action.name}"</h2>

                {Object.keys(promoCodes).length > 0 && (
                    <div className="mb-8">
                        <h3 className="font-bold text-base mt-4 mb-2 border-b pb-1">Промокоды</h3>
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
                )}

                {otherTrackingMethods.length > 0 && (
                    <div>
                         <h3 className="font-bold text-base mt-4 mb-2 border-b pb-1">Другие способы отслеживания</h3>
                         <ul className="list-disc list-inside space-y-1">
                            {otherTrackingMethods.map((method, index) => (
                                <li key={index}>{method}</li>
                            ))}
                         </ul>
                    </div>
                )}

                 {Object.keys(promoCodes).length === 0 && otherTrackingMethods.length === 0 && (
                     <p className="text-center text-gray-500 mt-8">Для данной акции не задано ни одного способа отслеживания.</p>
                 )}
            </div>
        </div>
    );
};


export function PrintTrackingReportButton({ action, socialPosts, asChild = true }: { action: Action, socialPosts: SocialPost[], asChild?: boolean }) {
    const componentRef = useRef<HTMLDivElement>(null);
    
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
        <Dialog>
            <DialogTrigger asChild>
                {TriggerButton}
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Предварительный просмотр: Отчет по способам отслеживания</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 -mx-6">
                    <div className="px-6 bg-gray-200">
                        <div ref={componentRef}>
                            <PrintContent action={action} socialPosts={socialPosts} />
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
