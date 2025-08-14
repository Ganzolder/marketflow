
"use client";

import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { History, Download, Filter } from "lucide-react";
import type { Activity } from '@/lib/types';
import { Bar, BarChart, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { stringify } from 'csv-stringify/sync';
import { EditKpiMetricButton } from './edit-kpi-metric-button';
import { DeleteKpiMetricButton } from './delete-kpi-metric-button';

type TableLog = {
    logId: string;
    kpiId: string;
    kpiName: string;
    date: string;
    value: number;
    cumulative: number;
    originalLog: any;
    originalKpi: any;
}

export function KpiHistoryModal({ activity, campaignId, actionId }: { activity: Activity, campaignId: string, actionId: string }) {
    const [open, setOpen] = useState(false);
    const [selectedKpis, setSelectedKpis] = useState<string[]>(() => activity.kpis.map(kpi => kpi.id));
    const locale = 'ru-RU';
    const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };

    const { chartData, tableLogs, chartConfig } = useMemo(() => {
        // 1. Prepare Chart Data (Aggregated by Date)
        const allLogsForChart: { date: string, kpiId: string, value: number }[] = [];
        activity.kpis.forEach(kpi => {
            kpi.metrics.forEach(metric => {
                allLogsForChart.push({ date: metric.date, kpiId: kpi.id, value: metric.value });
            });
        });
        allLogsForChart.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const dataByDate: Record<string, any> = {};
        const cumulativeTotalsForChart: Record<string, number> = {};
        activity.kpis.forEach(kpi => {
            cumulativeTotalsForChart[kpi.id] = 0;
        });

        allLogsForChart.forEach(log => {
            const dateStr = log.date;
            if (!dataByDate[dateStr]) {
                dataByDate[dateStr] = { date: dateStr };
                activity.kpis.forEach(kpi => {
                    dataByDate[dateStr][kpi.id] = 0;
                    dataByDate[dateStr][`${kpi.id}_cumulative`] = cumulativeTotalsForChart[kpi.id];
                });
            }
            dataByDate[dateStr][log.kpiId] = (dataByDate[dateStr][log.kpiId] || 0) + log.value;
            cumulativeTotalsForChart[log.kpiId] += log.value;
            Object.keys(dataByDate).forEach(d => {
                if (new Date(d) >= new Date(dateStr)) {
                    dataByDate[d][`${log.kpiId}_cumulative`] = cumulativeTotalsForChart[log.kpiId];
                }
            });
        });
        const finalChartData = Object.values(dataByDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 2. Prepare Table Data (Raw logs with cumulative totals)
        const finalTableLogs: TableLog[] = [];
        const cumulativeTotalsForTable: Record<string, number> = {};
         activity.kpis.forEach(kpi => {
            cumulativeTotalsForTable[kpi.id] = 0;
        });

        const allLogsForTable = activity.kpis
            .flatMap(kpi => kpi.metrics.map(log => ({ ...log, kpiId: kpi.id, kpiName: kpi.name, originalKpi: kpi })))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        allLogsForTable.forEach(log => {
            cumulativeTotalsForTable[log.kpiId] += log.value;
            finalTableLogs.push({
                logId: log.id,
                kpiId: log.kpiId,
                kpiName: log.kpiName,
                date: log.date,
                value: log.value,
                cumulative: cumulativeTotalsForTable[log.kpiId],
                originalLog: log,
                originalKpi: log.originalKpi
            });
        });
        
        finalTableLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        // 3. Prepare Chart Config
        const config: any = {};
        activity.kpis.forEach((kpi) => {
            const kpiIdHash = kpi.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const colorIndex = (kpiIdHash % 5) + 1;
            const colorVar = `hsl(var(--chart-${colorIndex}))`;
            config[kpi.id] = { label: kpi.name, color: colorVar };
            config[`${kpi.id}_cumulative`] = { label: `${kpi.name} (Итог)`, color: colorVar };
        });

        return { chartData: finalChartData, tableLogs: finalTableLogs, chartConfig: config };
    }, [activity.kpis]);
    
    const filteredTableLogs = tableLogs.filter(log => selectedKpis.includes(log.kpiId));


    const handleToggleKpi = (kpiId: string) => {
        setSelectedKpis(prev =>
            prev.includes(kpiId) ? prev.filter(id => id !== kpiId) : [...prev, kpiId]
        );
    };

    const handleExport = () => {
        const csvData = stringify(filteredTableLogs, {
            header: true,
            columns: [
                { key: 'date', header: 'Дата' },
                { key: 'kpiName', header: 'KPI' },
                { key: 'value', header: 'Значение' },
                { key: 'cumulative', header: 'Накопительный итог' },
            ],
        });
        
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `history_${activity.name}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const chartMargin = { top: 20, right: 20, bottom: 5, left: 0 };
    const yAxisWidth = 60;
    
    const kpisWithOptions = activity.kpis.filter(kpi => kpi.metrics.length > 0);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <History className="mr-2 h-4 w-4" />
                    История
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[90vw] lg:max-w-[1200px] h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>История показателей для: {activity.name}</DialogTitle>
                    <DialogDescription>
                        Анализируйте динамику KPI во времени.
                    </DialogDescription>
                </DialogHeader>
                
                {kpisWithOptions.length === 0 ? (
                     <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Нет данных для отображения.
                     </div>
                ) : (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
                    <div className="lg:col-span-1 flex flex-col gap-4 border-r pr-6">
                        <h4 className="font-semibold flex items-center gap-2"><Filter className="w-4 h-4" />Фильтр KPI</h4>
                         <div className="space-y-2">
                             {kpisWithOptions.map((kpi) => (
                                <div key={kpi.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`check-${kpi.id}`}
                                        checked={selectedKpis.includes(kpi.id)}
                                        onCheckedChange={() => handleToggleKpi(kpi.id)}
                                        style={{ accentColor: chartConfig[kpi.id]?.color }}
                                    />
                                    <Label htmlFor={`check-${kpi.id}`} className="text-sm font-normal">
                                        {kpi.name}
                                    </Label>
                                </div>
                            ))}
                         </div>
                    </div>

                    <div className="lg:col-span-3 flex flex-col gap-6 min-h-0">
                        {/* Charts */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-shrink-0">
                             <div>
                                <h4 className="font-semibold mb-2 text-center">Накопительный итог</h4>
                                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                    <LineChart data={chartData} margin={chartMargin}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => new Date(value).toLocaleDateString(locale, {month: 'short', day: 'numeric'})} />
                                        <YAxis tickLine={false} axisLine={false} width={yAxisWidth} />
                                        <Tooltip content={<ChartTooltipContent />} />
                                        <Legend />
                                        {selectedKpis.map(kpiId => (
                                             <Line key={kpiId} dataKey={`${kpiId}_cumulative`} type="monotone" stroke={`var(--color-${kpiId})`} strokeWidth={2} dot={false} name={chartConfig[`${kpiId}_cumulative`]?.label} />
                                        ))}
                                    </LineChart>
                                </ChartContainer>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2 text-center">Динамика по дням</h4>
                                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                    <BarChart data={chartData} margin={chartMargin}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => new Date(value).toLocaleDateString(locale, {month: 'short', day: 'numeric'})} />
                                        <YAxis tickLine={false} axisLine={false} width={yAxisWidth} />
                                        <Tooltip content={<ChartTooltipContent />} />
                                        <Legend />
                                         {selectedKpis.map(kpiId => (
                                             <Bar key={kpiId} dataKey={kpiId} fill={`var(--color-${kpiId})`} radius={4} name={chartConfig[kpiId]?.label} />
                                        ))}
                                    </BarChart>
                                </ChartContainer>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex flex-col flex-1 min-h-0">
                             <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold">Все записи</h4>
                                <Button variant="outline" size="sm" onClick={handleExport}>
                                    <Download className="mr-2 h-4 w-4"/>
                                    Экспорт в CSV
                                </Button>
                            </div>
                            <div className="flex-1 overflow-auto border rounded-lg">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-sm">
                                        <TableRow>
                                            <TableHead>Дата</TableHead>
                                            <TableHead>KPI</TableHead>
                                            <TableHead className="text-right">Значение</TableHead>
                                            <TableHead className="text-right">Накопительный итог</TableHead>
                                            <TableHead className="text-right w-[100px]">Действия</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTableLogs.length > 0 ? filteredTableLogs.map((log) => (
                                            <TableRow key={log.logId}>
                                                <TableCell>{new Date(log.date).toLocaleDateString(locale, dateOptions)}</TableCell>
                                                <TableCell>{log.kpiName}</TableCell>
                                                <TableCell className="text-right font-medium">+{log.value.toLocaleString(locale)}</TableCell>
                                                <TableCell className="text-right">{log.cumulative.toLocaleString(locale)}</TableCell>
                                                <TableCell>
                                                     <div className="flex items-center justify-end space-x-1">
                                                        <EditKpiMetricButton 
                                                            log={log.originalLog}
                                                            kpiId={log.kpiId}
                                                            campaignId={campaignId}
                                                            actionId={actionId}
                                                            activityId={activity.id}
                                                        />
                                                        <DeleteKpiMetricButton 
                                                            logId={log.logId}
                                                            kpiId={log.kpiId}
                                                            campaignId={campaignId}
                                                            actionId={actionId}
                                                            activityId={activity.id}
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                    Нет записей для выбранных KPI.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                             </div>
                        </div>
                    </div>
                </div>
                )}


                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Закрыть</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

