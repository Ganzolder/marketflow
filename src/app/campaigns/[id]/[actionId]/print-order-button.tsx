
"use client";

import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Printer } from "lucide-react";
import type { Action, Campaign } from '@/lib/types';
import { useReactToPrint } from 'react-to-print';

// Converted to a class component for react-to-print compatibility
class PrintContent extends React.Component<{ action: Action, campaign: Campaign }> {
    render() {
        const { action, campaign } = this.props;

        const formatDate = (dateString: string) => {
            if (!dateString) return '__________';
            return new Date(dateString).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }

        const plannedBudget = action.activities?.reduce((sum, activity) => sum + activity.budget, 0) || 0;

        return (
            <div className="print-container p-8 bg-white text-black">
                <style type="text/css" media="print">
                    {`
                        @page { 
                            size: auto;
                            margin: 20mm;
                        }
                        body {
                            background-color: #fff;
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
                    <div className="min-h-[90vh] flex flex-col justify-between items-center text-center page-break">
                        <div className="flex-grow flex items-center">
                            <h1 className="text-2xl font-bold">Приказ о проведении маркетингового мероприятия</h1>
                        </div>
                        <div className="w-full text-left">
                            <p>№ ______</p>
                            <p>г. Томск</p>
                            <p>Дата: {new Date().toLocaleDateString('ru-RU')}</p>
                        </div>
                    </div>

                    <div className="min-h-[90vh]">
                        <p className="mb-4">В целях повышения узнаваемости бренда, увеличения продаж и привлечения новых клиентов</p>
                        <p className="text-center font-bold mb-4">ПРИКАЗЫВАЮ:</p>
                        <ol className="list-decimal list-inside space-y-3">
                            <li>Провести маркетинговое мероприятие "{action.name || '____________________'}" в период с {formatDate(action.startDate)} по {formatDate(action.endDate)}.</li>
                            <li>Ответственным за организацию и проведение мероприятия назначить {action.responsiblePerson || '____________________'}.</li>
                            <li>Маркетинговому отделу ({action.marketingHead || '____________________'}) обеспечить:
                                <ul className="list-disc list-inside ml-6">
                                    <li>- разработку концепции и плана мероприятия;</li>
                                    <li>- подготовку рекламных материалов (баннеры, листовки, промопосты и т. д.);</li>
                                    <li>- взаимодействие с партнёрами и подрядчиками;</li>
                                    <li>- контроль за исполнением бюджета.</li>
                                </ul>
                            </li>
                            <li>Отделу продаж (____________________) обеспечить участие сотрудников в мероприятии и подготовку специальных предложений для клиентов.</li>
                            <li>IT-отделу ({action.itHead || '____________________'}) обеспечить техническую поддержку онлайн-части мероприятия (если требуется).</li>
                            <li>Финансовому отделу ({action.financeHead || '____________________'}) выделить необходимый бюджет в размере {new Intl.NumberFormat('ru-RU').format(plannedBudget)} рублей и осуществлять контроль за его расходованием.</li>
                            <li>Контроль за исполнением приказа возложить на {action.curator || '____________________'}.</li>
                        </ol>
                        <p className="mt-4">Основание: План маркетинговых активностей на ____________________, служебная записка ____________________.</p>

                        <div className="mt-12">
                            <p>Директор <span className="inline-block border-b border-black w-48 mx-2"></span> /Гавриленко А.С.</p>
                        </div>

                        <div className="mt-8">
                            <p>С приказом ознакомлены:</p>
                            <p className="mt-2">Нечепуренко А.В., гл.бухгалтер <span className="inline-block border-b border-black w-24 ml-2"></span></p>
                            <p className="mt-2">Опалева К.В., маркетолог <span className="inline-block border-b border-black w-24 ml-2"></span></p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};


export function PrintOrderButton({ action, campaign }: { action: Action, campaign: Campaign }) {
    const componentRef = useRef<PrintContent>(null);
    
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `Приказ - ${action.name}`,
    });


    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Printer className="mr-2 h-4 w-4" />
                    Печать приказа
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Предварительный просмотр: Приказ</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-auto bg-gray-200">
                   {/* The component to be printed */}
                   <PrintContent action={action} campaign={campaign} ref={componentRef} />
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
