
"use client";

import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { History, Download, Filter } from "lucide-react";
import type { Activity, KPI, KpiMetricLog } from '@/lib/types';
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

type FlattenedLog = {
    logId: string;
    kpiId: string;
    kpiName: string;
    date: string;
    value: number;
    cumulative: number;
}

export function KpiHistoryModal({ activity, campaignId, actionId }: { activity: Activity, campaignId: string, actionId: string }) {
    const [open, setOpen] = useState(false);
    const [selectedKpis, setSelectedKpis] = useState<string[]>(() => activity.kpis.map(kpi => kpi.id));
    const locale = 'ru-RU';
    const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };

    const { chartData, flattenedLogs, chartConfig } = useMemo(() => {
        const allLogs: (KpiMetricLog & { kpiId: string, kpiName: string })[] = [];
        activity.kpis.forEach(kpi => {
            kpi.metrics.forEach(metric => {
                allLogs.push({ ...metric, kpiId: kpi.id, kpiName: kpi.name });
            });
        });
        
        allLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const dataByDate: Record<string, any> = {};
        const cumulativeTotals: Record<string, number> = {};
        const allFlattenedLogs: FlattenedLog[] = [];
        
        activity.kpis.forEach(kpi => {
            cumulativeTotals[kpi.id] = 0;
        });

        allLogs.forEach(log => {
            const dateStr = log.date;
            if (!dataByDate[dateStr]) {
                dataByDate[dateStr] = { date: dateStr };
                 activity.kpis.forEach(kpi => {
                    dataByDate[dateStr][kpi.id] = 0;
                    dataByDate[dateStr][`${kpi.id}_cumulative`] = cumulativeTotals[kpi.id];
                 });
            }
            
            dataByDate[dateStr][log.kpiId] = (dataByDate[dateStr][log.kpiId] || 0) + log.value;
            cumulativeTotals[log.kpiId] += log.value;
            
            allFlattenedLogs.push({
                logId: log.id,
                kpiId: log.kpiId,
                kpiName: log.kpiName,
                date: log.date,
                value: log.value,
                cumulative: cumulativeTotals[log.kpiId],
            });

            // Update cumulative totals for all dates after this log
            Object.keys(dataByDate).forEach(d => {
                if (new Date(d) >= new Date(dateStr)) {
                    dataByDate[d][`${log.kpiId}_cumulative`] = cumulativeTotals[log.kpiId];
                }
            });
        });
        
        const finalChartData = Object.values(dataByDate).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const finalFlattenedLogs = allFlattenedLogs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const config: any = {};
        activity.kpis.forEach((kpi) => {
             const kpiIdHash = kpi.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
             const colorIndex = (kpiIdHash % 5) + 1;
             config[kpi.id] = { label: kpi.name, color: `hsl(var(--chart-${colorIndex}))` };
             config[`${kpi.id}_cumulative`] = { label: `${kpi.name} (Итог)`, color: `hsl(var(--chart-${colorIndex}))` };
        });

        return { chartData: finalChartData, flattenedLogs: finalFlattenedLogs, chartConfig: config };

    }, [activity.kpis]);

    const handleToggleKpi = (kpiId: string) => {
        setSelectedKpis(prev =>
            prev.includes(kpiId) ? prev.filter(id => id !== kpiId) : [...prev, kpiId]
        );
    };

    const handleExport = () => {
        const csvData = stringify(flattenedLogs, {
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
                                        style={{ color: chartConfig[kpi.id]?.color }}
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
                                        {flattenedLogs.map((log, index) => {
                                            const originalKpi = activity.kpis.find(k => k.id === log.kpiId);
                                            const originalLog = originalKpi?.metrics.find(m => m.id === log.logId);
                                            if (!originalLog || !originalKpi) return null;
                                            
                                            return (
                                            <TableRow key={`${log.logId}-${index}`}>
                                                <TableCell>{new Date(log.date).toLocaleDateString(locale, dateOptions)}</TableCell>
                                                <TableCell>{log.kpiName}</TableCell>
                                                <TableCell className="text-right font-medium">+{log.value.toLocaleString(locale)}</TableCell>
                                                <TableCell className="text-right">{log.cumulative.toLocaleString(locale)}</TableCell>
                                                <TableCell>
                                                     <div className="flex items-center justify-end space-x-1">
                                                        <EditKpiMetricButton 
                                                            log={originalLog}
                                                            kpiId={originalKpi.id}
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
                                        )})}
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

