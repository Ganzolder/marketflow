
"use client";

import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Printer, FileText } from "lucide-react";
import type { Action, Campaign } from '@/lib/types';

function PrintContent({ action, campaign }: { action: Action, campaign: Campaign }) {
    const formatDate = (dateString: string) => {
        if (!dateString) return '__________';
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    const plannedBudget = action.activities?.reduce((sum, activity) => sum + activity.budget, 0) || 0;
    const maxBudget = plannedBudget * 1.20;

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
                        page-break-after: always;
                    }
                `}
            </style>
            <div className="print-content font-serif text-sm">
                 <div className="flex justify-end mb-8">
                    <div className="text-right">
                        <p>Утверждаю</p>
                        <p>Директор ООО АВТОГИК</p>
                        <p>Гавриленко А. С.</p>
                        <p className="mt-2">_____________________</p>
                    </div>
                </div>

                <h1 className="text-xl font-bold text-center mb-4">Смета расходов</h1>
                <p className="text-center mb-6">на проведение маркетинговых мероприятий {formatDate(action.startDate)}</p>

                <table className="w-full border-collapse border border-black">
                    <thead>
                        <tr>
                            <th className="border border-black p-2 text-center">№</th>
                            <th className="border border-black p-2 text-left">Наименование затрат</th>
                            <th className="border border-black p-2 text-center">Единица измерения</th>
                            <th className="border border-black p-2 text-center">Количество единиц</th>
                            <th className="border border-black p-2 text-right">Цена, руб.</th>
                            <th className="border border-black p-2 text-right">Сумма, руб.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(action.activities || []).map((activity, index) => (
                             <tr key={activity.id}>
                                <td className="border border-black p-2 text-center">{index + 1}</td>
                                <td className="border border-black p-2">{activity.name}</td>
                                <td className="border border-black p-2 text-center">услуга</td>
                                <td className="border border-black p-2 text-center">1</td>
                                <td className="border border-black p-2 text-right">{new Intl.NumberFormat('ru-RU').format(activity.budget)}</td>
                                <td className="border border-black p-2 text-right">{new Intl.NumberFormat('ru-RU').format(activity.budget)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={5} className="text-right font-bold p-2">Итого:</td>
                            <td className="font-bold border border-black p-2 text-right">{new Intl.NumberFormat('ru-RU').format(plannedBudget)}</td>
                        </tr>
                    </tfoot>
                </table>

                <div className="mt-6 text-sm">
                    <p>Цены неокончательные. Возможно повышение в пределах 20%</p>
                    <p>Максимальная сумма расходов – {new Intl.NumberFormat('ru-RU').format(maxBudget)}</p>
                </div>


                <div className="mt-12 grid grid-cols-2 gap-8">
                    <div>
                        <p>Главный бухгалтер</p>
                        <p className="mt-4">_________________ / {action.financeHead || '____________________'}</p>
                    </div>
                    <div>
                        <p>Составил(а)</p>
                        <p className="mt-4">_________________ / {action.marketingHead || '____________________'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};


export function PrintEstimateButton({ action, campaign, asChild = true }: { action: Action, campaign: Campaign, asChild?: boolean }) {
    const componentRef = useRef<HTMLDivElement>(null);
    
    const handlePrint = () => {
        const contentToPrint = componentRef.current?.innerHTML;
        if (contentToPrint) {
            const printWindow = window.open('', '_blank', 'height=800,width=800');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Печать сметы</title>');
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
            <FileText className="mr-2 h-4 w-4" />
            Смета акции
        </Button>
    );

    return (
        <Dialog>
            <DialogTrigger asChild>
                {TriggerButton}
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Предварительный просмотр: Смета расходов</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-auto bg-gray-200" >
                   {/* The component to be printed */}
                   <div ref={componentRef}>
                        <PrintContent action={action} campaign={campaign} />
                   </div>
                </div>
                 <DialogFooter className="mt-4">
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
