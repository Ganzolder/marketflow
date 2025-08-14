
"use client";

import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { History, Filter } from "lucide-react";
import type { Activity } from '@/lib/types';
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, Tooltip, XAxis, YAxis, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

export function KpiHistoryModal({ activity, campaignId, actionId }: { activity: Activity, campaignId: string, actionId: string }) {
    const [open, setOpen] = useState(false);
    const [selectedKpis, setSelectedKpis] = useState<string[]>(() => activity.kpis.map(kpi => kpi.id));
    const locale = 'ru-RU';

    const { chartData, chartConfig } = useMemo(() => {
        const allLogsForChart: { date: string, kpiId: string, value: number }[] = [];
        activity.kpis.forEach(kpi => {
            (kpi.metrics || []).forEach(metric => {
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
        
        const config: any = {};
        activity.kpis.forEach((kpi) => {
            const kpiIdHash = kpi.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const colorIndex = (kpiIdHash % 5) + 1;
            const colorVar = `hsl(var(--chart-${colorIndex}))`;
            config[kpi.id] = { label: kpi.name, color: colorVar };
            config[`${kpi.id}_cumulative`] = { label: `${kpi.name} (Итог)`, color: colorVar };
        });

        return { chartData: finalChartData, chartConfig: config };
    }, [activity.kpis]);

    const handleToggleKpi = (kpiId: string) => {
        setSelectedKpis(prev =>
            prev.includes(kpiId) ? prev.filter(id => id !== kpiId) : [...prev, kpiId]
        );
    };

    const chartMargin = { top: 30, right: 20, bottom: 5, left: 0 };
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
                <ScrollArea className="flex-1 pr-6 -mr-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-1 flex flex-col gap-4">
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

                        <div className="md:col-span-3 flex flex-col gap-6 min-h-0">
                             <div className="h-[300px]">
                                <h4 className="font-semibold mb-2 text-center">Накопительный итог</h4>
                                <ChartContainer config={chartConfig} className="h-full w-full">
                                    <LineChart data={chartData} margin={chartMargin}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => new Date(value).toLocaleDateString(locale, {month: 'short', day: 'numeric'})} />
                                        <YAxis tickLine={false} axisLine={false} width={yAxisWidth} />
                                        <Tooltip content={<ChartTooltipContent />} />
                                        <Legend />
                                        {selectedKpis.map(kpiId => (
                                             <Line key={`${kpiId}-cumulative-line`} dataKey={`${kpiId}_cumulative`} type="monotone" stroke={`var(--color-${kpiId})`} strokeWidth={2} dot={false} name={chartConfig[`${kpiId}_cumulative`]?.label}>
                                                <LabelList dataKey={`${kpiId}_cumulative`} position="top" offset={10} className="fill-foreground text-xs" formatter={(value: number) => value > 0 ? value.toLocaleString(locale) : ''} />
                                             </Line>
                                        ))}
                                    </LineChart>
                                </ChartContainer>
                            </div>
                            <div className="h-[300px]">
                                <h4 className="font-semibold mb-2 text-center">Динамика по дням</h4>
                                <ChartContainer config={chartConfig} className="h-full w-full">
                                    <BarChart data={chartData} margin={chartMargin}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => new Date(value).toLocaleDateString(locale, {month: 'short', day: 'numeric'})} />
                                        <YAxis tickLine={false} axisLine={false} width={yAxisWidth} />
                                        <Tooltip content={<ChartTooltipContent />} />
                                        <Legend />
                                         {selectedKpis.map(kpiId => (
                                             <Bar key={`${kpiId}-daily-bar`} dataKey={kpiId} fill={`var(--color-${kpiId})`} radius={4} name={chartConfig[kpiId]?.label}>
                                                <LabelList dataKey={kpiId} position="top" offset={8} className="fill-foreground text-xs" formatter={(value: number) => value > 0 ? value.toLocaleString(locale) : ''}/>
                                             </Bar>
                                        ))}
                                    </BarChart>
                                </ChartContainer>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
                )}


                <DialogFooter className="pt-4 mt-4 border-t">
                    <DialogClose asChild>
                        <Button variant="outline">Закрыть</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

