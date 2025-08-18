
"use client";

import type { Action } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EditActionConditionsButton } from './edit-action-conditions-button';

export function ActionConditionsCard({ action, campaignId }: { action: Action; campaignId: string; }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Условия акции</CardTitle>
          <CardDescription>
            Подробные правила и механика проведения акции.
          </CardDescription>
        </div>
        <EditActionConditionsButton action={action} campaignId={campaignId} />
      </CardHeader>
      {action.conditions && (
        <CardContent>
          <div className="p-4 bg-muted/50 rounded-lg text-muted-foreground whitespace-pre-wrap">
            {action.conditions}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
