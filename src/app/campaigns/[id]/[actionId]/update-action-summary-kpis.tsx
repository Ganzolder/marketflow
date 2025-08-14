
"use client";

import { useEffect, useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { updateActionSummaryKpis, type SummaryKpiFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Save } from 'lucide-react';
import type { Action } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="sm" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                </>
            ) : <>
                <Save className="mr-2 h-4 w-4" />
                Сохранить
            </>}
        </Button>
    )
}

type AggregatedKpi = {
    name: string;
    current: number;
    target: number;
};

type UpdateActionSummaryKpisFormProps = {
    kpis: AggregatedKpi[];
    action: Action;
    campaignId: string;
    locale: string;
};

export function UpdateActionSummaryKpisForm({ kpis, action, campaignId, locale }: UpdateActionSummaryKpisFormProps) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    
    const initialState: SummaryKpiFormState = { message: "" };
    const [state, dispatch] = useActionState(updateActionSummaryKpis, initialState);

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

    const defaultCheckedKpis = action.summaryKpis || [];

    return (
        <form action={dispatch} ref={formRef} className="space-y-4">
            <input type="hidden" name="campaignId" value={campaignId} />
            <input type="hidden" name="actionId" value={action.id} />
             <div className="flex justify-end">
                <SubmitButton />
            </div>
            <div className="grid lg:grid-cols-2 gap-x-8 gap-y-4">
                {kpis.map(goal => (
                    <div key={goal.name}>
                        <div className="flex justify-between items-center text-sm mb-1">
                            <div className="flex items-center gap-2">
                                 <Checkbox 
                                    id={`kpi-summary-${goal.name}`} 
                                    name={goal.name}
                                    defaultChecked={defaultCheckedKpis.includes(goal.name)}
                                 />
                                <Label htmlFor={`kpi-summary-${goal.name}`} className="text-muted-foreground">{goal.name}</Label>
                            </div>
                            <span className="font-medium">{goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0}%</span>
                        </div>
                        <Progress value={goal.target > 0 ? (goal.current / goal.target) * 100 : 0} className="h-3" />
                        <p className="text-sm text-muted-foreground text-right mt-1">
                            {goal.current.toLocaleString(locale)} / {goal.target.toLocaleString(locale)}
                        </p>
                    </div>
                ))}
            </div>
        </form>
    );
}
