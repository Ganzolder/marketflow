
"use client";

import { useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Campaign, Action, Activity, SocialPost } from '@/lib/types';
import { MultiSelect } from '@/components/ui/multi-select';
import { Label } from '@/components/ui/label';

interface GanttChartData {
  name: string;
  type: 'campaign' | 'action' | 'activity' | 'post';
  dates: [number, number];
  id: string;
  campaignId: string;
  actionId?: string;
}

const COLORS = {
  campaign: 'hsl(var(--chart-1))',
  action: 'hsl(var(--chart-2))',
  activity: 'hsl(var(--chart-3))',
  post: 'hsl(var(--chart-5))',
};

const CustomYAxisTick = ({ x, y, payload, allItems }: any) => {
  const item = allItems.find((d: GanttChartData) => d.name === payload.value);

  if (!item) {
    return null;
  }
  
  const INDENTATION = 20;
  let indentation = 0;
  if (item.type === 'action') indentation = INDENTATION;
  if (item.type === 'activity' || item.type === 'post') indentation = INDENTATION * 2;
  
  const linkHref = item.type === 'campaign' ? `/campaigns/${item.campaignId}` : 
                   item.type === 'action' ? `/campaigns/${item.campaignId}/${item.id}` : '#';

  const content = (
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="start"
        fill="#666"
        className="text-xs truncate"
      >
        <title>{item.name}</title>
        {item.type === 'campaign' && '🔹 '}
        {item.type === 'action' && '🔸 '}
        {item.type === 'activity' && '▫️ '}
        {item.type === 'post' && '▪️ '}
        {item.name}
      </text>
  )

  return (
    <g transform={`translate(${indentation}, ${y})`}>
      {item.type === 'activity' || item.type === 'post' ? (
        content
      ) : (
        <Link href={linkHref}>
          {content}
        </Link>
      )}
    </g>
  );
};


export function GanttChart({ campaigns, posts }: { campaigns: Campaign[], posts: SocialPost[] }) {
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
    
    const labels: { y: number, label: string, type: 'campaign' | 'action' | 'activity' | 'post' }[] = [];

    const filteredCampaigns = campaigns.filter(c => selectedCampaignIds.includes(c.id));
    const filteredPosts = posts.filter(p => p.campaignId && selectedCampaignIds.includes(p.campaignId));

    if (filteredCampaigns.length > 0) {
      const allDates: Date[] = [];
      filteredCampaigns.forEach(c => {
        allDates.push(new Date(c.startDate), new Date(c.endDate));
        c.actions?.forEach(a => {
          allDates.push(new Date(a.startDate), new Date(a.endDate));
          a.activities?.forEach(act => {
            allDates.push(new Date(act.startDate), new Date(act.endDate));
          });
        });
      });
      filteredPosts.forEach(p => {
        allDates.push(new Date(p.publicationDate));
      });

      if (allDates.length > 0) {
        overallMinDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        overallMaxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
      }
    }

    filteredCampaigns.forEach(campaign => {
      const campaignStart = new Date(campaign.startDate).getTime();
      const campaignEnd = new Date(campaign.endDate).getTime();
      allItems.push({ name: campaign.name, type: 'campaign', dates: [campaignStart, campaignEnd], id: campaign.id, campaignId: campaign.id });

      (campaign.actions || []).forEach(action => {
        const actionStart = new Date(action.startDate).getTime();
        const actionEnd = new Date(action.endDate).getTime();
        allItems.push({ name: action.name, type: 'action', dates: [actionStart, actionEnd], id: action.id, campaignId: campaign.id, actionId: action.id });

        (action.activities || []).forEach(activity => {
          const activityStart = new Date(activity.startDate).getTime();
          const activityEnd = new Date(activity.endDate).getTime();
          allItems.push({ name: activity.name, type: 'activity', dates: [activityStart, activityEnd], id: activity.id, campaignId: campaign.id, actionId: action.id });
        });
        
        filteredPosts.filter(p => p.actionId === action.id).forEach(post => {
            const postDate = new Date(post.publicationDate).getTime();
            allItems.push({ name: post.title, type: 'post', dates: [postDate, postDate], id: post.id, campaignId: campaign.id, actionId: action.id })
        });
      });
    });

    return { chartData: allItems.reverse(), yAxisLabels: labels, minDate: overallMinDate.getTime(), maxDate: overallMaxDate.getTime() };
  }, [campaigns, posts, selectedCampaignIds]);

  const campaignOptions = campaigns.map(c => ({ value: c.id, label: c.name }));

  const dateFormatter = (date: number) => {
    return new Date(date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
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
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} />
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
                        width={200} 
                        tickLine={false} 
                        axisLine={false}
                        tick={(props) => <CustomYAxisTick {...props} allItems={chartData} />}
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
                                            {dateFormatter(data.dates[0])}
                                            {data.dates[0] !== data.dates[1] && ` - ${dateFormatter(data.dates[1])}`}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Legend content={() => (
                        <div className="flex justify-center gap-4 text-xs mt-2">
                             <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{backgroundColor: COLORS.campaign}} /> Кампания</span>
                             <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{backgroundColor: COLORS.action}} /> Акция</span>
                             <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{backgroundColor: COLORS.activity}} /> Активность</span>
                             <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{backgroundColor: COLORS.post}} /> Пост</span>
                        </div>
                    )}/>
                    <Bar dataKey="dates" minPointSize={5}>
                        {chartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[entry.type]}/>
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
