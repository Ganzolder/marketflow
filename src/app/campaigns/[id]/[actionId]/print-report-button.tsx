
"use client";

import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Printer, BarChart } from "lucide-react";
import type { Action, Campaign, Expense } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

function PrintContent({ action, campaign }: { action: Action, campaign: Campaign }) {
    const locale = 'ru-RU';
    const currencyOptions = { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 };
    const formatDate = (dateString: string) => {
        if (!dateString) return '__________';
        return new Date(dateString).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    const plannedTotalBudget = action.activities?.reduce((sum, activity) => sum + activity.budget, 0) || 0;
    const actualTotalSpent = (action.activities?.reduce((sum, activity) => sum + (activity.spent || 0), 0) || 0) + (action.generalExpenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0);

    const salesKpiName = "Продажи";
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

    const plannedRevenue = plannedSales * (action.plannedAverageCheck || 0);
    const actualRevenue = actualSales * (action.actualAverageCheck || 0);
    const plannedProfit = plannedRevenue * ((action.plannedMarginality || 0) / 100);
    const actualProfit = actualRevenue * ((action.actualMarginality || 0) / 100);
    const plannedNetProfit = plannedProfit - plannedTotalBudget;
    const actualNetProfit = actualProfit - actualTotalSpent;
    
    const plannedRoi = plannedTotalBudget > 0 ? (plannedNetProfit / plannedTotalBudget) * 100 : 0;
    const actualRoi = actualTotalSpent > 0 ? (actualNetProfit / actualTotalSpent) * 100 : 0;
    
    const aggregatedKpis: Record<string, { current: number; target: number; }> = {};
      (action.activities || []).forEach(activity => {
        (activity.kpis || []).forEach(kpi => {
          if (kpi.includeInActionGoals !== false) {
            if (aggregatedKpis[kpi.name]) {
              aggregatedKpis[kpi.name].current += kpi.current;
              aggregatedKpis[kpi.name].target += kpi.target;
            } else {
              aggregatedKpis[kpi.name] = {
                current: kpi.current,
                target: kpi.target,
              };
            }
          }
        });
      });

    const aggregatedKpisArray = Object.entries(aggregatedKpis).map(([name, data]) => ({ name, ...data }));
    
    type EnrichedExpense = Expense & { activityName?: string; };
    const allExpenses: EnrichedExpense[] = [
      ...(action.generalExpenses || []).map(exp => ({ ...exp, activityName: 'Общий расход' })),
      ...(action.activities || []).flatMap(activity => 
          (activity.expenses || []).map(exp => ({ ...exp, activityName: activity.name }))
      )
    ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());


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
                    .print-table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .print-table th, .print-table td {
                        border: 1px solid #dee2e6;
                        padding: 8px;
                        text-align: left;
                    }
                    .print-table th {
                        background-color: #eaf4ff !important;
                        color: #000 !important;
                        font-weight: bold;
                    }
                    .print-table tr:nth-child(even) {
                        background-color: #f8f9fa !important;
                    }
                    .print-table tfoot {
                        font-weight: bold;
                        background-color: #eaf4ff !important;
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

                <h1 className="text-xl font-bold text-center mb-2">Отчет об эффективности</h1>
                <h2 className="text-lg text-center mb-6">Маркетинговая акция: "{action.name}"</h2>
                <p className="text-center text-xs mb-6">Период проведения: {formatDate(action.startDate)} - {formatDate(action.endDate)}</p>

                <h3 className="font-bold text-base mt-8 mb-2">1. Сводные финансовые показатели</h3>
                <table className="print-table">
                    <thead>
                        <tr>
                            <th>Показатель</th>
                            <th className="text-right">План</th>
                            <th className="text-right">Факт</th>
                            <th className="text-right">Выполнение, %</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>Бюджет</td><td className="text-right">{plannedTotalBudget.toLocaleString(locale)} ₽</td><td className="text-right">{actualTotalSpent.toLocaleString(locale)} ₽</td><td className="text-right">{plannedTotalBudget > 0 ? ((actualTotalSpent/plannedTotalBudget)*100).toFixed(1) : '—'}%</td></tr>
                        <tr><td>Выручка</td><td className="text-right">{plannedRevenue.toLocaleString(locale)} ₽</td><td className="text-right">{actualRevenue.toLocaleString(locale)} ₽</td><td className="text-right">{plannedRevenue > 0 ? ((actualRevenue/plannedRevenue)*100).toFixed(1) : '—'}%</td></tr>
                        <tr><td>Прибыль (без учета затрат)</td><td className="text-right">{plannedProfit.toLocaleString(locale)} ₽</td><td className="text-right">{actualProfit.toLocaleString(locale)} ₽</td><td className="text-right">{plannedProfit > 0 ? ((actualProfit/plannedProfit)*100).toFixed(1) : '—'}%</td></tr>
                        <tr><td>Чистая прибыль</td><td className="text-right">{plannedNetProfit.toLocaleString(locale)} ₽</td><td className="text-right">{actualNetProfit.toLocaleString(locale)} ₽</td><td className="text-right">—</td></tr>
                        <tr><td>ROI</td><td className="text-right">{plannedRoi.toFixed(1)}%</td><td className="text-right">{actualRoi.toFixed(1)}%</td><td className="text-right">—</td></tr>
                    </tbody>
                </table>
                
                <h3 className="font-bold text-base mt-8 mb-2">2. Ключевые показатели эффективности (KPI)</h3>
                <table className="print-table">
                    <thead>
                         <tr>
                            <th>Показатель</th>
                            <th className="text-right">План</th>
                            <th className="text-right">Факт</th>
                            <th className="text-right">Выполнение, %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {aggregatedKpisArray.map(kpi => (
                             <tr key={kpi.name}>
                                <td>{kpi.name}</td>
                                <td className="text-right">{kpi.target.toLocaleString(locale)}</td>
                                <td className="text-right">{kpi.current.toLocaleString(locale)}</td>
                                <td className="text-right">{kpi.target > 0 ? ((kpi.current/kpi.target)*100).toFixed(1) : '—'}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <h3 className="font-bold text-base mt-8 mb-2">3. Детализация расходов</h3>
                {allExpenses.length > 0 ? (
                    <table className="print-table">
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Описание</th>
                                <th>Активность</th>
                                <th className="text-right">Сумма</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allExpenses.map(expense => (
                                <tr key={expense.id}>
                                    <td>{formatDate(expense.date)}</td>
                                    <td>{expense.description}</td>
                                    <td>{expense.activityName}</td>
                                    <td className="text-right">{expense.amount.toLocaleString(locale)} ₽</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={3} className="text-right font-bold">Итого расходов:</td>
                                <td className="text-right font-bold">{actualTotalSpent.toLocaleString(locale)} ₽</td>
                            </tr>
                        </tfoot>
                    </table>
                ) : (
                    <p>Фактические расходы не зафиксированы.</p>
                )}


                <div className="mt-12 grid grid-cols-2 gap-8">
                    <div>
                        <p>Руководитель по маркетингу</p>
                        <p className="mt-4">_________________ / {action.marketingHead || '____________________'}</p>
                    </div>
                    <div>
                        <p>Ответственный</p>
                        <p className="mt-4">_________________ / {action.responsiblePerson || '____________________'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export function PrintReportButton({ action, campaign, asChild = true }: { action: Action, campaign: Campaign, asChild?: boolean }) {
    const componentRef = useRef<HTMLDivElement>(null);
    
    const handlePrint = () => {
        const contentToPrint = componentRef.current?.innerHTML;
        if (contentToPrint) {
            const printWindow = window.open('', '_blank', 'height=800,width=800');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Печать Отчета</title>');
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
            Отчёт
        </Button>
    );

    return (
        <Dialog>
            <DialogTrigger asChild>
                {TriggerButton}
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Предварительный просмотр: Отчёт об эффективности</DialogTitle>
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

  
