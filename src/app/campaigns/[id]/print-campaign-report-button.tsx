
"use client";

import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Printer, BarChart } from "lucide-react";
import type { Action, Campaign, Expense, SocialPost } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';

function PrintContent({ campaign, socialPosts }: { campaign: Campaign, socialPosts: SocialPost[] }) {
    const locale = 'ru-RU';
    const currencyOptions = { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 };
    const formatDate = (dateString: string) => {
        if (!dateString) return '__________';
        return new Date(dateString).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    return (
        <div className="print-container p-8 bg-white text-black">
            <style type="text/css" media="print">
                {`
                    @page { 
                        size: A4 portrait;
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
                     .page-break-before {
                        page-break-before: always;
                    }
                    .print-table {
                        width: 100%;
                        border-collapse: collapse;
                        border: 1px solid black;
                        font-size: 10px;
                    }
                    .print-table th, .print-table td {
                        border: 1px solid black;
                        padding: 4px;
                        text-align: left;
                    }
                    .print-table th {
                        background-color: #f2f2f2 !important;
                        color: #000 !important;
                        font-weight: bold;
                    }
                `}
            </style>
            <div className="print-content font-serif text-sm">
                <h1 className="text-xl font-bold text-center mb-2">Сводный отчет по кампании</h1>
                <h2 className="text-lg text-center mb-6">"{campaign.name}"</h2>
                <p className="text-center text-xs mb-6">Период проведения: {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</p>

                {campaign.actions.map((action, index) => {
                    const plannedTotalBudget = action.activities?.reduce((sum, activity) => sum + activity.budget, 0) || 0;
                    const actualTotalSpent = (action.activities?.reduce((sum, activity) => sum + (activity.spent || 0), 0) || 0) + (action.generalExpenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0);

                    const salesKpiName = action.salesKpiName || "Продажи";
                    let plannedSales = 0;
                    let actualSales = 0;
                    action.activities?.forEach(activity => {
                        activity.kpis?.forEach(kpi => {
                            if (kpi.name === salesKpiName) {
                                plannedSales += kpi.target;
                                actualSales += kpi.current;
                            }
                        });
                    });

                    const plannedRevenue = action.plannedRevenue || 0;
                    const actualRevenue = actualSales * (action.actualAverageCheck || 0);
                    const plannedProfit = action.plannedProfit || 0;
                    const actualGrossProfit = actualRevenue * ((action.actualMarginality || 0) / 100);
                    const actualNetProfit = actualGrossProfit - actualTotalSpent;
                    
                    const plannedRoi = plannedTotalBudget > 0 ? ((plannedProfit - plannedTotalBudget) / plannedTotalBudget) * 100 : 0;
                    const actualRoi = actualTotalSpent > 0 ? (actualNetProfit / actualTotalSpent) * 100 : 0;
                    
                    const aggregatedKpis: Record<string, { current: number; target: number; }> = {};
                    (action.activities || []).forEach(activity => {
                        (activity.kpis || []).forEach(kpi => {
                        if (kpi.includeInActionGoals !== false) {
                            if (aggregatedKpis[kpi.name]) {
                            aggregatedKpis[kpi.name].current += kpi.current;
                            aggregatedKpis[kpi.name].target += kpi.target;
                            } else {
                            aggregatedKpis[kpi.name] = { current: kpi.current, target: kpi.target };
                            }
                        }
                        });
                    });
                    const aggregatedKpisArray = Object.entries(aggregatedKpis).map(([name, data]) => ({ name, ...data }));
                    const actionSocialPosts = socialPosts.filter(p => p.actionId === action.id);
                    
                    return (
                        <div key={action.id} className={index > 0 ? "page-break-before" : ""}>
                            <h3 className="font-bold text-lg mt-6 mb-2 border-b-2 border-black pb-1">Акция: {action.name}</h3>
                            <p className="mb-4 text-xs text-gray-600">Период: {formatDate(action.startDate)} - {formatDate(action.endDate)} | Статус: {action.status}</p>
                            
                            <h4 className="font-bold text-base mt-4 mb-1">Описание</h4>
                            <p className="text-xs mb-4">{action.description || 'Нет описания.'}</p>
                            
                            <h4 className="font-bold text-base mt-4 mb-1">Финансовые показатели</h4>
                             <table className="print-table">
                                <thead>
                                    <tr>
                                        <th>Показатель</th>
                                        <th className="text-right">План</th>
                                        <th className="text-right">Факт</th>
                                        <th className="text-right">Выполнение</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>Бюджет</td><td className="text-right">{plannedTotalBudget.toLocaleString(locale)} ₽</td><td className="text-right">{actualTotalSpent.toLocaleString(locale)} ₽</td><td className="text-right">{plannedTotalBudget > 0 ? ((actualTotalSpent/plannedTotalBudget)*100).toFixed(1) : '—'}%</td></tr>
                                    <tr><td>Выручка</td><td className="text-right">{plannedRevenue.toLocaleString(locale)} ₽</td><td className="text-right">{actualRevenue.toLocaleString(locale)} ₽</td><td className="text-right">{plannedRevenue > 0 ? ((actualRevenue/plannedRevenue)*100).toFixed(1) : '—'}%</td></tr>
                                    <tr><td>Прибыль (чистая)</td><td className="text-right">{plannedProfit.toLocaleString(locale)} ₽</td><td className="text-right">{actualNetProfit.toLocaleString(locale)} ₽</td><td className="text-right">—</td></tr>
                                    <tr><td>ROI</td><td className="text-right">{plannedRoi.toFixed(1)}%</td><td className="text-right">{actualRoi.toFixed(1)}%</td><td className="text-right">—</td></tr>
                                </tbody>
                            </table>
                            
                             <h4 className="font-bold text-base mt-4 mb-1">Ключевые показатели (KPI)</h4>
                             <table className="print-table">
                                <thead>
                                    <tr>
                                        <th>Показатель</th>
                                        <th className="text-right">План</th>
                                        <th className="text-right">Факт</th>
                                        <th className="text-right">Выполнение</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {aggregatedKpisArray.length > 0 ? aggregatedKpisArray.map(kpi => (
                                        <tr key={kpi.name}>
                                            <td>{kpi.name}</td>
                                            <td className="text-right">{kpi.target.toLocaleString(locale)}</td>
                                            <td className="text-right">{kpi.current.toLocaleString(locale)}</td>
                                            <td className="text-right">{kpi.target > 0 ? ((kpi.current/kpi.target)*100).toFixed(1) : '—'}%</td>
                                        </tr>
                                    )) : <tr><td colSpan={4} className="text-center">Нет KPI</td></tr>}
                                </tbody>
                            </table>
                            
                            <h4 className="font-bold text-base mt-4 mb-1">SMM-посты</h4>
                             {actionSocialPosts.length > 0 ? (
                                <table className="print-table">
                                    <thead><tr><th>Дата</th><th>Заголовок</th><th>Платформы</th><th>Статус</th></tr></thead>
                                    <tbody>
                                        {actionSocialPosts.map(p => (
                                            <tr key={p.id}>
                                                <td>{formatDate(p.publicationDate)}</td>
                                                <td>{p.title}</td>
                                                <td>{p.platforms.join(', ')}</td>
                                                <td>{p.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             ): <p className="text-xs">Нет связанных постов.</p>}
                        </div>
                    )
                })}
                
                <div className="mt-12 text-xs text-gray-700">
                    <p>Отчет сгенерирован: {new Date().toLocaleString('ru-RU')}</p>
                </div>
            </div>
        </div>
    );
};

export function PrintCampaignReportButton({ campaign, socialPosts, asChild = true }: { campaign: Campaign, socialPosts: SocialPost[], asChild?: boolean }) {
    const componentRef = useRef<HTMLDivElement>(null);
    
    const handlePrint = () => {
        const contentToPrint = componentRef.current?.innerHTML;
        if (contentToPrint) {
            const printWindow = window.open('', '_blank', 'height=800,width=800');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Сводный отчет по кампании</title>');
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
            <BarChart className="mr-2 h-4 w-4" />
            Отчёт по кампании
        </Button>
    );

    return (
        <Dialog>
            <DialogTrigger asChild>
                {TriggerButton}
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Предварительный просмотр: Сводный отчет</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 -mx-6">
                   <div className="px-6 bg-gray-200">
                       <div ref={componentRef}>
                            <PrintContent campaign={campaign} socialPosts={socialPosts} />
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
