
"use client";

import { useState } from 'react';
import type { Action, ResourceStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Package, FilePlus, BadgeRussianRuble } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AddResourceButton } from './add-resource-button';
import { EditResourceButton } from './edit-resource-button';
import { DeleteResourceButton } from './delete-resource-button';

const resourceStatusTranslations: Record<ResourceStatus, string> = {
  draft: "Черновик",
  planned: "Запланировано",
  "in-progress": "В работе",
  ready: "Готово",
};

const resourceStatusStyles: Record<ResourceStatus, string> = {
  draft: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700/50",
  planned: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50",
  "in-progress": "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50",
  ready: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50",
};

export function ActionResourcesCard({ action, campaignId }: { action: Action; campaignId: string; }) {
  const [isOpen, setIsOpen] = useState(true);
  const allExpenses = [
    ...(action.generalExpenses || []),
    ...(action.activities || []).flatMap(a => a.expenses || [])
  ];

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CollapsibleTrigger asChild>
                <div className="flex-1 cursor-pointer group">
                    <div className="flex items-center gap-2">
                        <CardTitle>Ресурсы</CardTitle>
                        <ChevronDown className="h-5 w-5 transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                    <CardDescription>Ресурсы, необходимые для обеспечения акции.</CardDescription>
                </div>
            </CollapsibleTrigger>
            <AddResourceButton actionId={action.id} campaignId={campaignId} expenses={allExpenses} />
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            {action.resources && action.resources.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Ответственный</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Связанный расход</TableHead>
                    <TableHead className="text-right w-[100px]">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {action.resources.map(resource => {
                    const linkedExpense = allExpenses.find(e => e.id === resource.linkedExpenseId);
                    return (
                        <TableRow key={resource.id}>
                            <TableCell className="font-medium">{resource.name}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={resourceStatusStyles[resource.status]}>
                                    {resourceStatusTranslations[resource.status]}
                                </Badge>
                            </TableCell>
                            <TableCell>{resource.responsiblePerson || '—'}</TableCell>
                            <TableCell>{resource.plannedDate ? new Date(resource.plannedDate).toLocaleDateString('ru-RU') : '—'}</TableCell>
                            <TableCell>
                                {linkedExpense ? (
                                    <div className="flex items-center gap-2 text-xs">
                                        <BadgeRussianRuble className="w-3.5 h-3.5" />
                                        <span>{linkedExpense.description} ({linkedExpense.amount.toLocaleString('ru-RU')} ₽)</span>
                                    </div>
                                ) : '—'}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <EditResourceButton resource={resource} actionId={action.id} campaignId={campaignId} expenses={allExpenses} />
                                    <DeleteResourceButton resourceId={resource.id} actionId={action.id} campaignId={campaignId} />
                                </div>
                            </TableCell>
                        </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                <Package className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p>Ресурсы для этой акции еще не добавлены.</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
