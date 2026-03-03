'use client';

import { GlobalGanttChart } from '@/components/global-gantt-chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function PlanGanttSection() {
  return (
    <Card className="group-bg-3 border-l-4 border-l-[hsl(210_12%_85%)]">
      <CardHeader>
        <CardTitle>Календарный график акций</CardTitle>
        <CardDescription>
          Периоды кампаний, акций и активностей на временной шкале.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GlobalGanttChart />
      </CardContent>
    </Card>
  );
}
