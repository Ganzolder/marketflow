
"use client";

import { useActionState, useTransition, useEffect } from 'react';
import { updateExpenseStatus, type ExpenseStatusFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Expense, ExpenseStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const expenseStatusTranslations: Record<ExpenseStatus, string> = {
  planned: "Запланировано",
  'invoice-received': "Счёт получен",
  'pending-payment': "Счёт на оплате",
  paid: "Оплачен",
};

const expenseStatusStyles: Record<ExpenseStatus, string> = {
  planned: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50",
  'invoice-received': "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50",
  'pending-payment': "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50",
  paid: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50",
};

type UpdateExpenseStatusProps = {
    expense: Expense & { activityId?: string }; // activityId is enriched in the list component
    actionId: string;
    campaignId: string;
}

export function UpdateExpenseStatus({ expense, actionId, campaignId }: UpdateExpenseStatusProps) {
    const { toast } = useToast();
    const initialState: ExpenseStatusFormState = { message: "" };
    const [isPending, startTransition] = useTransition();

    const formAction = updateExpenseStatus.bind(null);
    const [state, dispatch] = useActionState(formAction, initialState);

    useEffect(() => {
        if (state?.message) {
            if (state.error) {
                toast({
                    variant: "destructive",
                    title: "Ошибка",
                    description: state.message,
                });
            } else {
                toast({
                    title: "Успех",
                    description: state.message,
                });
            }
        }
    }, [state, toast]);

    const handleValueChange = (newStatus: ExpenseStatus) => {
        const formData = new FormData();
        formData.append('campaignId', campaignId);
        formData.append('actionId', actionId);
        formData.append('expenseId', expense.id);
        formData.append('activityId', expense.activityId || 'general'); // Fallback for safety
        formData.append('status', newStatus);
        
        startTransition(() => {
            dispatch(formData);
        });
    };
    
    const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <form onClick={stopPropagation}>
             <Select onValueChange={handleValueChange} value={expense.status} disabled={isPending}>
                <SelectTrigger className="h-auto border-none p-0 bg-transparent w-auto focus:ring-0 focus:ring-offset-0 disabled:opacity-70 disabled:cursor-not-allowed [&_svg]:ml-1">
                    <SelectValue asChild>
                         <Badge variant="outline" className={expenseStatusStyles[expense.status]}>
                            {expenseStatusTranslations[expense.status]}
                        </Badge>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent onClick={stopPropagation}>
                    {Object.entries(expenseStatusTranslations).map(([status, translation]) => (
                         <SelectItem key={status} value={status}>{translation}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </form>
    );
}
