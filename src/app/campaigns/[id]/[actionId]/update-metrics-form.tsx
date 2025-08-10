
"use client";

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { updateActivityMetrics, type MetricsFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { Activity, KPI } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Loader2, DollarSign } from 'lucide-react';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="sm" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Обновление...
                </>
            ) : "Обновить"}
        </Button>
    )
}

export function UpdateMetricsForm({ activity, campaignId, actionId }: { activity: Activity, campaignId: string, actionId: string }) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const locale = 'ru-RU';
    const currencyOptions = { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 };
    
    const initialState: MetricsFormState = { message: "" };
    const [state, dispatch] = useFormState(updateActivityMetrics, initialState);

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
                formRef.current?.reset();
            }
        }
    }, [state, toast]);

    const budgetProgress = activity.budget > 0 ? (activity.spent / activity.budget) * 100 : 0;
    
    return (
        <form action={dispatch} ref={formRef} className="space-y-6">
            <input type="hidden" name="campaignId" value={campaignId} />
            <input type="hidden" name="actionId" value={actionId} />
            <input type="hidden" name="activityId" value={activity.id} />

            {/* Budget Section */}
            <div>
                <Label className="text-base font-medium">Бюджет</Label>
                <div className="text-sm text-muted-foreground mt-1 mb-2">
                    {new Intl.NumberFormat(locale, currencyOptions).format(activity.spent)} / {new Intl.NumberFormat(locale, currencyOptions).format(activity.budget)}
                </div>
                <Progress value={budgetProgress} indicatorClassName={budgetProgress > 100 ? 'bg-destructive' : 'bg-primary'} />
                <div className="flex items-end gap-2 mt-3">
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor={`newSpent-${activity.id}`} className="text-xs">Добавить трату</Label>
                         <div className="relative">
                            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id={`newSpent-${activity.id}`}
                                name="newSpent"
                                type="number"
                                placeholder="0.00"
                                className="pl-7 h-9"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Separator />
            
            {/* KPI Section */}
            <div>
                <Label className="text-base font-medium">KPI</Label>
                <div className="space-y-4 mt-2">
                    {activity.kpis && activity.kpis.length > 0 ? (
                        activity.kpis.map(kpi => (
                            <div key={kpi.id}>
                                <div className="flex justify-between items-center mb-1">
                                    <Label htmlFor={`kpi-${kpi.id}`} className="text-sm font-normal">{kpi.name}</Label>
                                    <span className="text-xs text-muted-foreground">
                                        {kpi.current.toLocaleString(locale)} / {kpi.target.toLocaleString(locale)} {kpi.unit}
                                    </span>
                                </div>
                                <Progress value={kpi.target > 0 ? (kpi.current / kpi.target) * 100 : 0} className="h-2" />
                                 <div className="grid w-full gap-1.5 mt-3">
                                    <Label htmlFor={`kpi-${kpi.id}`} className="text-xs">Обновить факт</Label>
                                    <Input
                                        id={`kpi-${kpi.id}`}
                                        name={`kpi-${kpi.id}`}
                                        type="number"
                                        placeholder={kpi.current.toString()}
                                        className="h-9"
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                         <p className="text-xs text-center text-muted-foreground py-2">KPI не добавлены.</p>
                    )}
                </div>
            </div>
            
            <div className="flex justify-end pt-2">
                <SubmitButton />
            </div>
        </form>
    );
}

