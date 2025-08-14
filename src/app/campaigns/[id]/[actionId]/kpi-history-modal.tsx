
"use client";

import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { History, Filter, TrendingUp } from "lucide-react";
import type { Activity, KPI } from '@/lib/types';
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, Tooltip, XAxis, YAxis, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

export function KpiHistoryModal({ activity, campaignId, actionId }: { activity: Activity, campaignId: string, actionId: string }) {
    const [open, setOpen] = useState(false);
    const [selectedKpis, setSelectedKpis] = useState<string[]>(() => activity.kpis.map(kpi => kpi.id));
    const locale = 'ru-RU';

    const { chartData, conversionData, chartConfig } = useMemo(() => {
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
            
            // Update cumulative totals for all subsequent dates
            const currentLogDate = new Date(dateStr).getTime();
            Object.keys(cumulativeTotalsForChart).forEach(kpiId => {
                 if (kpiId === log.kpiId) {
                     cumulativeTotalsForChart[kpiId] += log.value;
                 }
            });
            
             Object.keys(dataByDate).forEach(d => {
                const dataDate = new Date(d).getTime();
                if (dataDate >= currentLogDate) {
                     Object.keys(cumulativeTotalsForChart).forEach(kpiId => {
                        dataByDate[d][`${kpiId}_cumulative`] = cumulativeTotalsForChart[kpiId];
                    });
                }
            });
        });

        const finalChartData = Object.values(dataByDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const finalConversionData = finalChartData.map(dataPoint => {
            const conversionPoint: any = { date: dataPoint.date };
            activity.kpis.forEach(kpi => {
                if (kpi.parentId) {
                    const parentValue = dataPoint[`${kpi.parentId}_cumulative`] || 0;
                    const childValue = dataPoint[`${kpi.id}_cumulative`] || 0;
                    const conversionKey = `conv_${kpi.id}`;
                    if (parentValue > 0) {
                        conversionPoint[conversionKey] = (childValue / parentValue) * 100;
                    } else {
                        conversionPoint[conversionKey] = 0;
                    }
                }
            });
            return conversionPoint;
        });
        
        const config: any = {};
        activity.kpis.forEach((kpi) => {
            const kpiIdHash = kpi.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const colorIndex = (kpiIdHash % 5) + 1;
            const colorVar = `hsl(var(--chart-${colorIndex}))`;
            config[kpi.id] = { label: kpi.name, color: colorVar };
            config[`${kpi.id}_cumulative`] = { label: `${kpi.name} (Итог)`, color: colorVar };
             if (kpi.parentId) {
                const parentKpi = activity.kpis.find(p => p.id === kpi.parentId);
                if (parentKpi) {
                    config[`conv_${kpi.id}`] = { 
                        label: `CR ${kpi.name}`, 
                        color: colorVar 
                    };
                }
            }
        });

        return { chartData: finalChartData, conversionData: finalConversionData, chartConfig: config };
    }, [activity.kpis]);

    const handleToggleKpi = (kpiId: string) => {
        setSelectedKpis(prev =>
            prev.includes(kpiId) ? prev.filter(id => id !== kpiId) : [...prev, kpiId]
        );
    };
    
    const kpisWithOptions = activity.kpis.filter(kpi => kpi.metrics.length > 0);
    const conversionKpis = activity.kpis.filter(kpi => kpi.parentId && kpisWithOptions.some(k => k.id === kpi.id));

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
                <div className="grid md:grid-cols-4 gap-6 flex-1 min-h-0">
                    <div className="md:col-span-1 flex flex-col gap-4">
                        <h4 className="font-semibold flex items-center gap-2"><Filter className="w-4 h-4" />Фильтр KPI</h4>
                         <ScrollArea className="flex-1 pr-2 -mr-2">
                            <div className="space-y-2">
                                {activity.kpis.map((kpi) => (
                                    <div key={kpi.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`check-${kpi.id}`}
                                            checked={selectedKpis.includes(kpi.id)}
                                            onCheckedChange={() => handleToggleKpi(kpi.id)}
                                            disabled={!kpisWithOptions.some(k => k.id === kpi.id)}
                                        />
                                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: chartConfig[kpi.id]?.color }} />
                                        <Label htmlFor={`check-${kpi.id}`} className={`text-sm font-normal ${!kpisWithOptions.some(k => k.id === kpi.id) ? 'text-muted-foreground' : ''}`}>
                                            {kpi.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    <ScrollArea className="md:col-span-3 flex-1">
                        <div className="flex flex-col gap-6 h-full pr-4">
                             <div className="h-[300px]">
                                <h4 className="font-semibold mb-2 text-center">Накопительный итог</h4>
                                <ChartContainer config={chartConfig} className="h-full w-full">
                                    <LineChart data={chartData} margin={{ top: 30, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => new Date(value).toLocaleDateString(locale, {month: 'short', day: 'numeric'})} />
                                        <YAxis tickLine={false} axisLine={false} width={60} />
                                        <Tooltip content={<ChartTooltipContent />} />
                                        <Legend />
                                        {selectedKpis.map(kpiId => (
                                             <Line key={`${kpiId}-cumulative-line`} dataKey={`${kpiId}_cumulative`} type="monotone" stroke={chartConfig[kpiId]?.color} strokeWidth={2} dot={false} name={chartConfig[`${kpiId}_cumulative`]?.label}>
                                                <LabelList dataKey={`${kpiId}_cumulative`} position="top" offset={10} className="fill-foreground text-xs" formatter={(value: number) => value > 0 ? value.toLocaleString(locale) : ''} />
                                             </Line>
                                        ))}
                                    </LineChart>
                                </ChartContainer>
                            </div>
                            <div className="h-[300px] mt-8">
                                <h4 className="font-semibold mb-2 text-center">Динамика по дням</h4>
                                <ChartContainer config={chartConfig} className="h-full w-full">
                                    <BarChart data={chartData} margin={{ top: 30, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => new Date(value).toLocaleDateString(locale, {month: 'short', day: 'numeric'})} />
                                        <YAxis tickLine={false} axisLine={false} width={60} />
                                        <Tooltip content={<ChartTooltipContent />} />
                                        <Legend />
                                         {selectedKpis.map(kpiId => (
                                             <Bar key={`${kpiId}-daily-bar`} dataKey={kpiId} fill={chartConfig[kpiId]?.color} radius={4} name={chartConfig[kpiId]?.label}>
                                                <LabelList dataKey={kpiId} position="top" offset={8} className="fill-foreground text-xs" formatter={(value: number) => value > 0 ? value.toLocaleString(locale) : ''}/>
                                             </Bar>
                                        ))}
                                    </BarChart>
                                </ChartContainer>
                            </div>
                            {conversionKpis.length > 0 && (
                            <div className="h-[300px] mt-8">
                                <h4 className="font-semibold mb-2 text-center flex items-center justify-center gap-2">
                                    <TrendingUp className="w-5 h-5"/>
                                    Конверсии (%)
                                </h4>
                                <ChartContainer config={chartConfig} className="h-full w-full">
                                    <LineChart data={conversionData} margin={{ top: 30, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => new Date(value).toLocaleDateString(locale, {month: 'short', day: 'numeric'})} />
                                        <YAxis tickLine={false} axisLine={false} width={60} unit="%" />
                                        <Tooltip content={<ChartTooltipContent formatter={(value) => `${Number(value).toFixed(2)}%`} />} />
                                        <Legend />
                                        {conversionKpis.map(kpi => {
                                            const parentIsSelected = selectedKpis.includes(kpi.parentId!);
                                            const childIsSelected = selectedKpis.includes(kpi.id);
                                            if (parentIsSelected && childIsSelected) {
                                                return (
                                                    <Line key={`conv-${kpi.id}`} dataKey={`conv_${kpi.id}`} type="monotone" stroke={chartConfig[kpi.id]?.color} strokeWidth={2} name={chartConfig[`conv_${kpi.id}`]?.label} dot={false}>
                                                          <LabelList dataKey={`conv_${kpi.id}`} position="top" offset={10} className="fill-foreground text-xs" formatter={(value: number) => value > 0 ? `${value.toFixed(1)}%` : ''} />
                                                    </Line>
                                                )
                                            }
                                            return null;
                                        })}
                                    </LineChart>
                                </ChartContainer>
                            </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
                )}


                <DialogFooter className="pt-4 mt-4 border-t shrink-0">
                    <DialogClose asChild>
                        <Button variant="outline">Закрыть</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
