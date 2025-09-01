
"use client";

import { useMemo, useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Campaign } from '@/lib/types';
import { MultiSelect } from '@/components/ui/multi-select';
import { Label } from '@/components/ui/label';
import { Skeleton } from './ui/skeleton';
import { getCampaigns } from '@/lib/data';

interface GanttChartData {
  name: string;
  type: 'campaign' | 'action' | 'activity';
  dates: [number, number];
  id: string;
  campaignId: string;
  actionId?: string;
}

const COLORS = {
  campaign: '#003366',
  action: '#01796F',
  activity: 'hsl(var(--chart-5))',
};

const CustomYAxisTick = ({ y, payload, allItems }: { y: number, payload: any, allItems: GanttChartData[] }) => {
  const item = allItems.find((d: GanttChartData) => d.name === payload.value);

  if (!item) {
    return null;
  }
  
  const INDENTATION = 20;
  let indentation = 0;
  if (item.type === 'action') indentation = INDENTATION;
  if (item.type === 'activity') indentation = INDENTATION * 2;
  
  const linkHref = item.type === 'campaign' ? `/campaigns/${item.campaignId}` : 
                   item.type === 'action' ? `/campaigns/${item.campaignId}/${item.id}` : undefined;

  const CampaignIcon = () => (
     <svg width="1em" height="1em" viewBox="0 0 16 16" fill="#003366" className="inline-block -mt-px mr-1" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 0L16 8L8 16L0 8L8 0Z"/>
     </svg>
  );

  const ActionIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 16 16" fill="#01796F" className="inline-block -mt-px mr-1" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 0L16 8L8 16L0 8L8 0Z"/>
    </svg>
  );

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
        {item.type === 'campaign' && <tspan alignmentBaseline="middle"><CampaignIcon /></tspan>}
        {item.type === 'action' && <tspan alignmentBaseline="middle"><ActionIcon /></tspan>}
        {item.type === 'activity' && '▫️ '}
        {item.name}
      </text>
  )

  return (
    <g transform={`translate(${indentation}, ${y})`}>
      {linkHref ? (
        <Link href={linkHref}>
          {content}
        </Link>
      ) : (
        content
      )}
    </g>
  );
};


export function GlobalGanttChart() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const allCampaigns = await getCampaigns();
      setCampaigns(allCampaigns);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const selectedCampaignIds = useMemo(() => {
    const ganttCampaigns = searchParams.get('ganttCampaigns');
    return ganttCampaigns ? ganttCampaigns.split(',') : campaigns.map(c => c.id).slice(0, 3);
  }, [searchParams, campaigns]);

  useEffect(() => {
    if (!isLoading && !searchParams.get('ganttCampaigns') && campaigns.length > 0) {
        const defaultIds = campaigns.slice(0, 3).map(c => c.id).join(',');
        const params = new URLSearchParams(searchParams.toString());
        params.set('ganttCampaigns', defaultIds);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [campaigns, searchParams, router, pathname, isLoading]);

  const handleCampaignChange = (selected: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (selected.length > 0) {
      params.set('ganttCampaigns', selected.join(','));
    } else {
      params.delete('ganttCampaigns');
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };
  
  const { chartData, minDate, maxDate } = useMemo(() => {
    let allItems: GanttChartData[] = [];
    let overallMinDate = new Date();
    let overallMaxDate = new Date();
    overallMaxDate.setDate(overallMaxDate.getDate() + 30); 
    
    const filteredCampaigns = campaigns.filter(c => selectedCampaignIds.includes(c.id));

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
      });
    });

    return { chartData: allItems, minDate: overallMinDate.getTime(), maxDate: overallMaxDate.getTime() };
  }, [campaigns, selectedCampaignIds]);

  const campaignOptions = campaigns.map(c => ({ value: c.id, label: c.name }));

  const dateFormatter = (date: number) => {
    return new Date(date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
      return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Диаграмма кампаний</h2>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
      )
  }

  return (
    <div>
        <h2 className="text-lg font-semibold mb-2">Диаграмма кампаний</h2>
        <div className="grid gap-2 mb-4">
            <Label htmlFor="campaign-filter">Фильтр по кампаниям</Label>
            <MultiSelect
                options={campaignOptions}
                selected={selectedCampaignIds}
                onChange={handleCampaignChange}
                placeholder="Выберите кампании"
                className="w-full"
            />
        </div>
        <div style={{ width: '100%', height: chartData.length * 40 + 60 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: 5, bottom: 20 }}
                    barCategoryGap="20%"
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} />
                    <XAxis 
                        type="number" 
                        domain={[minDate, maxDate]} 
                        tickFormatter={dateFormatter}
                        scale="time"
                        allowDataOverflow
                        tickCount={6}
                        fontSize={10}
                    />
                    <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={150} 
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
                             <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{backgroundColor: '#003366'}} /> Кампания</span>
                             <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{backgroundColor: '#01796F'}} /> Акция</span>
                             <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{backgroundColor: 'hsl(var(--chart-5))'}} /> Активность</span>
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
    </div>
  );
}
