
"use client";

import { useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Campaign, Action, Activity } from '@/lib/types';
import { MultiSelect } from '@/components/ui/multi-select';
import { Label } from '@/components/ui/label';

interface GanttChartData {
  name: string;
  type: 'campaign' | 'action' | 'activity';
  dates: [number, number];
  id: string;
  campaignId: string;
}

const COLORS = {
  campaign: 'hsl(var(--chart-1))',
  action: 'hsl(var(--chart-2))',
  activity: 'hsl(var(--chart-3))',
};

export function GanttChart({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedCampaignIds = useMemo(() => {
    const ganttCampaigns = searchParams.get('ganttCampaigns');
    return ganttCampaigns ? ganttCampaigns.split(',') : campaigns.map(c => c.id).slice(0, 3);
  }, [searchParams, campaigns]);

  const handleCampaignChange = (selected: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (selected.length > 0) {
      params.set('ganttCampaigns', selected.join(','));
    } else {
      params.delete('ganttCampaigns');
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };
  
  const { chartData, yAxisLabels, minDate, maxDate } = useMemo(() => {
    let allItems: GanttChartData[] = [];
    let overallMinDate = new Date();
    let overallMaxDate = new Date();
    overallMaxDate.setDate(overallMaxDate.getDate() + 30); // Default range
    
    let y = 0;
    const labels: { y: number, label: string, type: 'campaign' | 'action' | 'activity' }[] = [];

    const filteredCampaigns = campaigns.filter(c => selectedCampaignIds.includes(c.id));

    if (filteredCampaigns.length > 0) {
      const allDates = filteredCampaigns.flatMap(c => {
        const dates = [new Date(c.startDate), new Date(c.endDate)];
        c.actions?.forEach(a => {
          dates.push(new Date(a.startDate), new Date(a.endDate));
          a.activities?.forEach(act => {
            dates.push(new Date(act.startDate), new Date(act.endDate));
          });
        });
        return dates;
      });
      overallMinDate = new Date(Math.min(...allDates.map(d => d.getTime())));
      overallMaxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    }


    filteredCampaigns.forEach(campaign => {
      const campaignStart = new Date(campaign.startDate).getTime();
      const campaignEnd = new Date(campaign.endDate).getTime();
      allItems.push({ name: campaign.name, type: 'campaign', dates: [campaignStart, campaignEnd], id: campaign.id, campaignId: campaign.id });
      labels.push({ y, label: campaign.name, type: 'campaign' });
      y++;

      (campaign.actions || []).forEach(action => {
        const actionStart = new Date(action.startDate).getTime();
        const actionEnd = new Date(action.endDate).getTime();
        allItems.push({ name: action.name, type: 'action', dates: [actionStart, actionEnd], id: action.id, campaignId: campaign.id });
        labels.push({ y, label: action.name, type: 'action' });
        y++;

        (action.activities || []).forEach(activity => {
          const activityStart = new Date(activity.startDate).getTime();
          const activityEnd = new Date(activity.endDate).getTime();
          allItems.push({ name: activity.name, type: 'activity', dates: [activityStart, activityEnd], id: activity.id, campaignId: campaign.id });
          labels.push({ y, label: activity.name, type: 'activity' });
          y++;
        });
      });
    });

    return { chartData: allItems.reverse(), yAxisLabels: labels, minDate: overallMinDate.getTime(), maxDate: overallMaxDate.getTime() };
  }, [campaigns, selectedCampaignIds]);

  const campaignOptions = campaigns.map(c => ({ value: c.id, label: c.name }));

  const dateFormatter = (date: number) => {
    return new Date(date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
  };
  
  const yAxisFormatter = (index: number) => {
    const item = yAxisLabels[yAxisLabels.length - 1 - index];
    if (item) {
        if (item.type === 'campaign') return `🔹 ${item.label}`;
        if (item.type === 'action') return `🔸 ${item.label}`;
        return `     ${item.label}`;
    }
    return '';
  };

  if (campaigns.length === 0) {
      return (
        <Card>
            <CardHeader>
                <CardTitle>Диаграмма кампаний</CardTitle>
                <CardDescription>Нет данных для отображения. Создайте кампанию, чтобы начать.</CardDescription>
            </CardHeader>
        </Card>
      )
  }

  return (
    <Card>
      <CardHeader>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="grid gap-2 col-span-full md:col-span-3">
                <Label htmlFor="campaign-filter">Фильтр по кампаниям</Label>
                <MultiSelect
                    options={campaignOptions}
                    selected={selectedCampaignIds}
                    onChange={handleCampaignChange}
                    placeholder="Выберите кампании"
                    className="w-full"
                />
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: chartData.length * 40 + 60 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                    barCategoryGap="20%"
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis 
                        type="number" 
                        domain={[minDate, maxDate]} 
                        tickFormatter={dateFormatter}
                        scale="time"
                        allowDataOverflow
                        tickCount={8}
                    />
                    <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={150} 
                        tickLine={false} 
                        axisLine={false}
                        tick={props => {
                            const { x, y, payload } = props;
                            const item = chartData.find(d => d.name === payload.value);
                             const yOffset = -10; // Adjust as needed
                            return (
                                <g transform={`translate(${x},${y + yOffset})`}>
                                    <text x={0} y={0} dy={16} textAnchor="end" fill="#666" className="text-xs truncate">
                                        <title>{item?.name}</title>
                                        {item?.type === 'campaign' && '🔹 '}
                                        {item?.type === 'action' && '🔸 '}
                                        {item?.name}
                                    </text>
                                </g>
                            )
                        }}
                    />
                    <Tooltip
                        cursor={{fill: 'rgba(240, 240, 240, 0.5)'}}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-background border shadow-sm rounded-lg p-2 text-sm">
                                        <p className="font-bold">{data.name}</p>
                                        <p className="text-muted-foreground">
                                            {dateFormatter(data.dates[0])} - {dateFormatter(data.dates[1])}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Legend wrapperStyle={{ display: 'none' }} />
                    <Bar dataKey="dates" fill="#8884d8" minPointSize={5}>
                        {chartData.map((entry, index) => (
                            <Bar key={`bar-${index}`} fill={COLORS[entry.type]}/>
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
