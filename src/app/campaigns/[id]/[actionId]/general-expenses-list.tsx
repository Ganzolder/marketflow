

"use client";

import type { Action, Expense, Activity } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSymlink, Landmark } from "lucide-react";
import { AddGeneralExpenseButton } from "./add-general-expense-button";
import { DeleteGeneralExpenseButton } from "./delete-general-expense-button";
import { EditExpenseButton } from "./edit-expense-button";
import { DeleteExpenseButton } from "./delete-expense-button";
import { ScrollArea } from "@/components/ui/scroll-area";

type EnrichedExpense = Expense & {
    activityName?: string;
    activityId?: string;
}

export function GeneralExpensesList({ action, campaignId }: { action: Action; campaignId: string }) {
  const locale = 'ru-RU';
  const currencyOptions = { style: 'currency', currency: 'RUB' };
  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  
  const allExpenses: EnrichedExpense[] = [
      ...(action.generalExpenses || []).map(exp => ({ ...exp, activityName: 'Общий расход' })),
      ...(action.activities || []).flatMap(activity => 
          (activity.expenses || []).map(exp => ({ ...exp, activityName: activity.name, activityId: activity.id }))
      )
  ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  const totalExpenses = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Все расходы по акции</CardTitle>
            <CardDescription>
                Общие расходы и расходы, связанные с конкретными активностями.
            </CardDescription>
        </div>
        <AddGeneralExpenseButton campaignId={campaignId} actionId={action.id} activities={action.activities || []} />
      </CardHeader>
      <CardContent>
        {allExpenses.length > 0 ? (
          <ScrollArea className="w-full whitespace-nowrap">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Активность</TableHead>
                <TableHead>Юр. лицо</TableHead>
                <TableHead>Подтверждение</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{new Date(expense.date).toLocaleDateString(locale, dateOptions)}</TableCell>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell>
                      <Badge variant={expense.activityName === 'Общий расход' ? 'secondary' : 'outline'}>{expense.activityName}</Badge>
                  </TableCell>
                  <TableCell>{expense.legalEntity || '—'}</TableCell>
                  <TableCell>
                    {expense.photoURL ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={expense.photoURL} target="_blank" rel="noopener noreferrer">
                          <FileSymlink className="mr-2 h-4 w-4" />
                          <span>Просмотр</span>
                        </a>
                      </Button>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat(locale, currencyOptions).format(expense.amount)}</TableCell>
                   <TableCell className="text-right">
                       <div className="flex items-center justify-end space-x-1">
                          <EditExpenseButton 
                            expense={expense} 
                            campaignId={campaignId} 
                            actionId={action.id} 
                            activities={action.activities || []} 
                            originalActivityId={expense.activityId}
                          />
                          {expense.activityId ? (
                              <DeleteExpenseButton expenseId={expense.id} campaignId={campaignId} actionId={action.id} activityId={expense.activityId} />
                          ) : (
                              <DeleteGeneralExpenseButton expenseId={expense.id} campaignId={campaignId} actionId={action.id} />
                          )}
                       </div>
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </ScrollArea>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-10 border-2 border-dashed rounded-lg">
            <p>Расходы еще не добавлены.</p>
          </div>
        )}
         <div className="mt-4 text-right font-bold text-lg">
            Итого: {new Intl.NumberFormat(locale, currencyOptions).format(totalExpenses)}
        </div>
      </CardContent>
    </Card>
  );
}
