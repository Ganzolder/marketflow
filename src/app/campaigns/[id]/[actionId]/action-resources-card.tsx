
"use client";

import { useState } from 'react';
import type { Action, ResourceStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Package, FilePlus, BadgeRussianRuble } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddResourceButton } from './add-resource-button';
import { EditResourceButton } from './edit-resource-button';
import { DeleteResourceButton } from './delete-resource-button';
import { UpdateResourceStatus } from './update-resource-status';

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
                                <UpdateResourceStatus resource={resource} actionId={action.id} campaignId={campaignId} />
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
