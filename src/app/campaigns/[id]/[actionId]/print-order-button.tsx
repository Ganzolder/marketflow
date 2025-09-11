
"use client";

import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Printer } from "lucide-react";
import type { Action, Campaign } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

function PrintContent({ action, campaign }: { action: Action, campaign: Campaign }) {
    const formatDate = (dateString: string) => {
        if (!dateString) return { day: '«»', month: '______', year: '20 __' };
        const date = new Date(dateString);
        return {
            day: `«${date.getDate().toString().padStart(2, '0')}»`,
            month: date.toLocaleString('ru-RU', { month: 'long' }),
            year: date.getFullYear().toString()
        };
    }
    
    const today = formatDate(new Date().toISOString());

    const plannedBudget = action.activities?.reduce((sum, activity) => sum + activity.budget, 0) || 0;
    
    const numberToWords = (num: number) => {
        const text = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', currencyDisplay: 'name' }).format(num);
        return text.replace('российских рублей', 'рублей');
    }

    return (
        <div className="print-container p-8 bg-white text-black">
            <style type="text/css" media="print">
                {`
                    @page { 
                        size: A4;
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
                    .prose { max-width: 100%; }
                    ul { list-style-type: none; padding-left: 0; }
                    li { margin-top: 0.5rem; }
                `}
            </style>
            <div className="print-content font-serif text-sm">
                <div className="text-center space-y-1 mb-6">
                    <p className="font-bold">Общество с ограниченной ответственностью «АвтоГиК»</p>
                    <p className="text-xs">ОГРН 1137017000097, ИНН/КПП 7017321414/701701001, зарегистрировано 10.01.2013</p>
                    <p className="text-xs">Адрес: 634040, г. Томск, ул. Бела Куна, дом 13</p>
                </div>
                
                <h1 className="text-xl font-bold text-center mb-1">ПРИКАЗ</h1>
                <p className="text-center mb-6">№ М-___ от {today.day} {today.month} {today.year} г.</p>

                <p className="mb-4 text-justify indent-8">
                    В целях расширения рынка сбыта, привлечения дополнительного числа покупателей, формирования устойчивого интереса и спроса к продукции, а также для увеличения доходов
                </p>

                <p className="text-center font-bold mb-4">ПРИКАЗЫВАЮ:</p>
                
                <ol className="list-decimal list-inside space-y-3 prose">
                    <li>Утвердить проведение маркетинговой акции "{action.name}".</li>
                    <li>Утвердить условия проведения акции (Приложение № 1).</li>
                    <li>Утвердить смету расходов на проведение акции в размере "{plannedBudget.toLocaleString('ru-RU')} ({numberToWords(plannedBudget)})".</li>
                    <li>Ответственным за организацию акции назначить "{action.responsiblePerson || '____________________'}".</li>
                    <li>Контроль за выполнением приказа возлагаю на себя.</li>
                </ol>

                <div className="mt-12 space-y-6">
                     <div className="flex items-center gap-4">
                        <p>С приказом ознакомлен:</p>
                        <div className="border-b border-black flex-1"></div>
                        <p>"{action.responsiblePerson || '____________________'}"</p>
                    </div>
                     <div className="flex items-center gap-4 mt-8">
                        <p>Директор</p>
                        <div className="border-b border-black flex-1"></div>
                        <p>А.С. Гавриленко</p>
                    </div>
                </div>

                {action.conditions && (
                    <div className="page-break">
                        <div className="min-h-[90vh] flex flex-col">
                            <h2 className="text-lg font-bold text-center my-6">Приложение № 1</h2>
                            <h3 className="text-md font-semibold text-center mb-6">к приказу № М-___ от {today.day} {today.month} {today.year} г.</h3>
                            <h4 className="text-md font-semibold text-center mb-6">Условия проведения акции "{action.name}"</h4>
                            <div className="prose prose-sm whitespace-pre-wrap flex-1">{action.conditions}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


export function PrintOrderButton({ action, campaign, asChild = true }: { action: Action, campaign: Campaign, asChild?: boolean }) {
    const componentRef = useRef<HTMLDivElement>(null);
    
    const handlePrint = () => {
        const contentToPrint = componentRef.current?.innerHTML;
        if (contentToPrint) {
            const printWindow = window.open('', '_blank', 'height=800,width=800');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Печать приказа</title>');
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
            <Printer className="mr-2 h-4 w-4" />
            Печать приказа
        </Button>
    );

    return (
        <Dialog>
            <DialogTrigger asChild>
                {TriggerButton}
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Предварительный просмотр: Приказ</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 -mx-6">
                   <div className="px-6 bg-gray-200">
                       {/* The component to be printed */}
                       <div ref={componentRef}>
                            <PrintContent action={action} campaign={campaign} />
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
