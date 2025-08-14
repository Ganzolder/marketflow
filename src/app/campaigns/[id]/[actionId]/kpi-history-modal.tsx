
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { History, Download, Pencil, Trash2 } from "lucide-react";
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
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from '@/components/ui/checkbox';
import { DeleteKpiMetricButton } from './delete-kpi-metric-button';
import { EditKpiMetricButton } from './edit-kpi-metric-button';


type KpiHistoryModalProps = {
    activity: Activity;
    campaignId: string;
    actionId: string;
};

type FlattenedKpiLog = {
    logId: string;
    kpiId: string;
    kpiName: string;
    date: string;
    value: number;
    runningTotal: number;
}

export function KpiHistoryModal({ activity, campaignId, actionId }: KpiHistoryModalProps) {
    const [open, setOpen] = useState(false);
    const locale = 'ru-RU';
    const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };

    const kpis = activity.kpis || [];

    const [visibleKpis, setVisibleKpis] = useState<Record<string, boolean>>(() => {
        const initialState: Record<string, boolean> = {};
        kpis.forEach(kpi => {
            initialState[kpi.name] = true;
        });
        return initialState;
    });

    const flattenedLogs: FlattenedKpiLog[] = [];
    const runningTotals: Record<string, number> = {};

    kpis.forEach(kpi => {
        const sortedMetrics = [...(kpi.metrics || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        runningTotals[kpi.name] = 0; // Reset running total for each KPI
        sortedMetrics.forEach(metric => {
            runningTotals[kpi.name] += metric.value;
            flattenedLogs.push({
                logId: metric.id,
                kpiId: kpi.id,
                kpiName: kpi.name,
                date: metric.date,
                value: metric.value,
                runningTotal: runningTotals[kpi.name],
            });
        });
    });

    flattenedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // --- Chart Data Preparation ---
    const chartConfig = kpis.reduce((acc, kpi, index) => {
        acc[kpi.name] = {
            label: kpi.name,
            color: `hsl(var(--chart-${index + 1}))`,
        };
        return acc;
    }, {} as ChartConfig);

    const chartData = kpis.length > 0 ? 
        Object.values(
            flattenedLogs.reduce((acc, log) => {
            const date = new Date(log.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
            if (!acc[date]) {
                acc[date] = { date };
                 kpis.forEach(kpi => {
                    acc[date][kpi.name] = 0;
                });
            }
            // Daily value
            acc[date][log.kpiName] = (acc[date][log.kpiName] || 0) + log.value;
            
            return acc;
            }, {} as Record<string, any>)
        ).sort((a, b) => {
            const dateA = new Date(a.date.split('.').reverse().join('-'));
            const dateB = new Date(b.date.split('.').reverse().join('-'));
            return dateA.getTime() - dateB.getTime();
        })
        : [];
        
    const cumulativeChartData = kpis.length > 0 ?
        (() => {
            const dataMap: Record<string, any> = {};
            const cumulativeTotals: Record<string, number> = {};

            // Initialize cumulative totals
            kpis.forEach(kpi => {
                cumulativeTotals[kpi.name] = 0;
            });
            
            // Re-sort flattened logs by date ascending for cumulative calculation
            const sortedLogsAsc = [...flattenedLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            sortedLogsAsc.forEach(log => {
                const date = new Date(log.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
                if (!dataMap[date]) {
                    dataMap[date] = { date, ...cumulativeTotals };
                }
                cumulativeTotals[log.kpiName] += log.value;
                dataMap[date] = { date, ...cumulativeTotals };
            });

            return Object.values(dataMap);
        })()
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
                                        <CardDescription>Изменения KPI за каждый день. Используйте фильтры для выбора нужных показателей.</CardDescription>
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
                                                 {kpis.filter(kpi => visibleKpis[kpi.name]).map((kpi) => (
                                                    <Bar dataKey={kpi.name} key={kpi.id} fill={`var(--color-${kpi.name})`} stackId="a" radius={4} />
                                                 ))}
                                            </BarChart>
                                        </ChartContainer>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 p-2 border rounded-lg">
                                            {kpis.map((kpi, index) => (
                                                <div key={`daily-filter-${kpi.id}`} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`kpi-toggle-${kpi.id}`}
                                                        key={`daily-checkbox-${kpi.id}`}
                                                        checked={visibleKpis[kpi.name]}
                                                        onCheckedChange={(checked) => {
                                                            setVisibleKpis(prev => ({
                                                                ...prev,
                                                                [kpi.name]: !!checked
                                                            }));
                                                        }}
                                                        style={{ color: `hsl(var(--chart-${index + 1}))` }}
                                                        className="border-current data-[state=checked]:bg-current"
                                                    />
                                                    <label
                                                        htmlFor={`kpi-toggle-${kpi.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        {kpi.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="cumulative">
                                 <Card>
                                    <CardHeader>
                                        <CardTitle>Накопительный итог</CardTitle>
                                        <CardDescription>Общий рост KPI с течением времени. Используйте фильтры для выбора нужных показателей.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ChartContainer config={chartConfig} className="h-[400px] w-full">
                                            <LineChart accessibilityLayer data={cumulativeChartData}>
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
                                                 {kpis.filter(kpi => visibleKpis[kpi.name]).map((kpi) => (
                                                    <Line dataKey={kpi.name} name={kpi.name} key={kpi.id} type="monotone" stroke={`var(--color-${kpi.name})`} strokeWidth={2} dot={false} />
                                                 ))}
                                            </LineChart>
                                        </ChartContainer>
                                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 p-2 border rounded-lg">
                                            {kpis.map((kpi, index) => (
                                                <div key={`cum-filter-${kpi.id}`} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`cum-kpi-toggle-${kpi.id}`}
                                                        key={`cum-checkbox-${kpi.id}`}
                                                        checked={visibleKpis[kpi.name]}
                                                        onCheckedChange={(checked) => {
                                                            setVisibleKpis(prev => ({
                                                                ...prev,
                                                                [kpi.name]: !!checked
                                                            }));
                                                        }}
                                                        style={{ color: `hsl(var(--chart-${index + 1}))` }}
                                                        className="border-current data-[state=checked]:bg-current"
                                                    />
                                                    <label
                                                        htmlFor={`cum-kpi-toggle-${kpi.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        {kpi.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
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
                                                        <TableHead className="text-right w-[100px]">Действия</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {flattenedLogs.map((log) => (
                                                        <TableRow key={log.logId}>
                                                            <TableCell>{new Date(log.date).toLocaleDateString(locale, dateOptions)}</TableCell>
                                                            <TableCell className="font-medium">{log.kpiName}</TableCell>
                                                            <TableCell className="text-right">+{log.value.toLocaleString(locale)}</TableCell>
                                                            <TableCell className="text-right font-semibold">{log.runningTotal.toLocaleString(locale)}</TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end space-x-1">
                                                                    <EditKpiMetricButton 
                                                                        log={log}
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
