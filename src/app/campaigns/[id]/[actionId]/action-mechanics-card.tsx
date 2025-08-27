
"use client";

import { useState } from 'react';
import type { Action } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Cog } from 'lucide-react';
import { EditActionMechanicsButton } from './edit-action-mechanics-button';

export function ActionMechanicsCard({ action, campaignId }: { action: Action; campaignId: string; }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CollapsibleTrigger asChild>
                <div className="flex-1 cursor-pointer group">
                    <div className="flex items-center gap-2">
                        <CardTitle>Механика акции</CardTitle>
                        <ChevronDown className="h-5 w-5 transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                    <CardDescription>Инструкции для менеджеров и описание процесса.</CardDescription>
                </div>
            </CollapsibleTrigger>
            <EditActionMechanicsButton action={action} campaignId={campaignId} />
          </div>
        </CardHeader>
        <CollapsibleContent>
            <CardContent>
                {action.mechanics ? (
                    <div className="prose prose-sm dark:prose-invert prose-p:my-2 prose-ul:my-2 prose-li:my-1 text-foreground whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
                        {action.mechanics}
                    </div>
                ) : (
                    <div className="text-center text-sm text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                        <Cog className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p>Механика для этой акции еще не описана.</p>
                     </div>
                )}
            </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
