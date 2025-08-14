
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
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs';


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

    flattenedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // --- Chart Data Preparation ---
    const chartConfig = (activity.kpis || []).reduce((acc, kpi, index) => {
        acc[kpi.name] = {
            label: kpi.name,
            color: `hsl(var(--chart-${index + 1}))`,
        };
        return acc;
    }, {} as ChartConfig);

    const chartData = (activity.kpis || []).length > 0 ? 
        Object.values(
            flattenedLogs.reduce((acc, log) => {
            const date = new Date(log.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
            if (!acc[date]) {
                acc[date] = { date };
            }
            // Daily value
            acc[date][log.kpiName] = (acc[date][log.kpiName] || 0) + log.value;
            // Cumulative value
            acc[date][`${log.kpiName}_cumulative`] = log.runningTotal;
            return acc;
            }, {} as Record<string, any>)
        ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        : [];
    
    
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
            <DialogContent className="max-w-[90vw] w-full lg:max-w-[70vw]">
                <DialogHeader>
                    <DialogTitle>История KPI для "{activity.name}"</DialogTitle>
                    <DialogDescription>
                        Просмотр журнала изменений для всех ключевых показателей эффективности в этой активности.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                    {flattenedLogs.length > 0 ? (
                        <Tabs defaultValue="daily">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="daily">По дням</TabsTrigger>
                                <TabsTrigger value="cumulative">Накопительный</TabsTrigger>
                                <TabsTrigger value="table">Таблица</TabsTrigger>
                            </TabsList>
                             <TabsContent value="daily">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Динамика по дням</CardTitle>
                                        <CardDescription>Изменения KPI за каждый день.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ChartContainer config={chartConfig} className="h-[400px] w-full">
                                            <BarChart accessibilityLayer data={chartData}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    tickLine={false}
                                                    tickMargin={10}
                                                    axisLine={false}
                                                />
                                                <YAxis />
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                <ChartLegend content={<ChartLegendContent />} />
                                                 {(activity.kpis || []).map(kpi => (
                                                    <Bar dataKey={kpi.name} key={kpi.id} fill={`var(--color-${kpi.name})`} radius={4} />
                                                 ))}
                                            </BarChart>
                                        </ChartContainer>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="cumulative">
                                 <Card>
                                    <CardHeader>
                                        <CardTitle>Накопительный итог</CardTitle>
                                        <CardDescription>Общий рост KPI с течением времени.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ChartContainer config={chartConfig} className="h-[400px] w-full">
                                            <LineChart accessibilityLayer data={chartData}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    tickLine={false}
                                                    tickMargin={10}
                                                    axisLine={false}
                                                />
                                                <YAxis />
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                <ChartLegend content={<ChartLegendContent />} />
                                                 {(activity.kpis || []).map(kpi => (
                                                    <Line dataKey={`${kpi.name}_cumulative`} name={kpi.name} key={kpi.id} type="monotone" stroke={`var(--color-${kpi.name})`} strokeWidth={2} dot={false} />
                                                 ))}
                                            </LineChart>
                                        </ChartContainer>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="table">
                                 <Card>
                                    <CardHeader>
                                        <CardTitle>Детальные данные</CardTitle>
                                        <CardDescription>Все записи об изменении KPI.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
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
                                    </CardContent>
                                 </Card>
                            </TabsContent>
                        </Tabs>

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
