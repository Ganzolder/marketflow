
"use client";

import type { KPI } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditKpiMetricButton } from "./edit-kpi-metric-button";
import { DeleteKpiMetricButton } from "./delete-kpi-metric-button";

type KpiLogListProps = {
    kpi: KPI;
    activityId: string;
    actionId: string;
    campaignId: string;
}

export function KpiLogList({ kpi, activityId, actionId, campaignId }: KpiLogListProps) {
    const locale = 'ru-RU';
    const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    
    // Sort logs by most recent first for display
    const sortedLogs = [...(kpi.metrics || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="bg-muted/50 rounded-lg p-2 mt-2">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="h-8">Дата</TableHead>
                        <TableHead className="h-8 text-right">Значение</TableHead>
                        <TableHead className="h-8 text-right w-[80px]">Действия</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedLogs.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell className="py-1.5">{new Date(log.date).toLocaleDateString(locale, dateOptions)}</TableCell>
                            <TableCell className="py-1.5 text-right font-medium">+{log.value.toLocaleString(locale)}</TableCell>
                            <TableCell className="py-1.5 text-right">
                                <div className="flex items-center justify-end space-x-1">
                                    <EditKpiMetricButton 
                                        log={{...log, kpiId: kpi.id}}
                                        campaignId={campaignId}
                                        actionId={actionId}
                                        activityId={activityId}
                                    />
                                    <DeleteKpiMetricButton 
                                        logId={log.id}
                                        kpiId={kpi.id}
                                        campaignId={campaignId}
                                        actionId={actionId}
                                        activityId={activityId}
                                    />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
