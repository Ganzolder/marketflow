
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { History, Download } from "lucide-react";
import type { Activity } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { stringify } from 'csv-stringify/sync';

type KpiHistoryModalProps = {
    activity: Activity;
};

type FlattenedKpiLog = {
    kpiName: string;
    date: string;
    value: number;
    runningTotal: number;
}

export function KpiHistoryModal({ activity }: KpiHistoryModalProps) {
    const [open, setOpen] = useState(false);
    const locale = 'ru-RU';
    const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };

    const flattenedLogs: FlattenedKpiLog[] = [];
    const runningTotals: Record<string, number> = {};

    (activity.kpis || []).forEach(kpi => {
        // Sort metrics by date for correct running total calculation
        const sortedMetrics = [...(kpi.metrics || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        sortedMetrics.forEach(metric => {
            if (!runningTotals[kpi.name]) {
                runningTotals[kpi.name] = 0;
            }
            runningTotals[kpi.name] += metric.value;
            flattenedLogs.push({
                kpiName: kpi.name,
                date: metric.date,
                value: metric.value,
                runningTotal: runningTotals[kpi.name],
            });
        });
    });

    // Sort all logs by date for final display
    flattenedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const handleExport = () => {
        const csvData = stringify(flattenedLogs, {
            header: true,
            columns: [
                { key: 'date', header: 'Дата' },
                { key: 'kpiName', header: 'KPI' },
                { key: 'value', header: 'Значение' },
                { key: 'runningTotal', header: 'Итого' },
            ]
        });

        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `kpi_history_${activity.name}_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <History className="mr-2 h-4 w-4" />
                    История KPI
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>История KPI для "{activity.name}"</DialogTitle>
                    <DialogDescription>
                        Просмотр журнала изменений для всех ключевых показателей эффективности в этой активности.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                    {flattenedLogs.length > 0 ? (
                        <ScrollArea className="h-[400px] border rounded-md">
                            <Table>
                                <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm">
                                    <TableRow>
                                        <TableHead>Дата</TableHead>
                                        <TableHead>KPI</TableHead>
                                        <TableHead className="text-right">Значение</TableHead>
                                        <TableHead className="text-right">Итог</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {flattenedLogs.map((log, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{new Date(log.date).toLocaleDateString(locale, dateOptions)}</TableCell>
                                            <TableCell className="font-medium">{log.kpiName}</TableCell>
                                            <TableCell className="text-right">+{log.value.toLocaleString(locale)}</TableCell>
                                            <TableCell className="text-right font-semibold">{log.runningTotal.toLocaleString(locale)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         </ScrollArea>
                    ) : (
                        <div className="text-center text-sm text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                            <p>История изменений KPI пока пуста.</p>
                            <p className="text-xs mt-1">Добавьте данные в форме ниже, чтобы начать отслеживание.</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Закрыть</Button>
                    </DialogClose>
                     <Button onClick={handleExport} disabled={flattenedLogs.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Экспорт в CSV
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
