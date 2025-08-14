
"use client";

import { useEffect, useRef, useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateActivityMetrics, type MetricsFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { Activity, KPI } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Loader2, ChevronDown, History } from 'lucide-react';
import { AddExpenseButton } from './add-expense-button';
import { KpiLogList } from './kpi-log-list';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { KpiHistoryModal } from './kpi-history-modal';


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

function KpiItem({ kpi, campaignId, actionId, activityId, locale }: { kpi: KPI, campaignId: string, actionId: string, activityId: string, locale: string }) {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
         <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
            <div>
                <div className="flex justify-between items-center mb-1">
                    <Label htmlFor={`kpi-${kpi.id}`} className="text-sm font-normal">{kpi.name}</Label>
                    <span className="text-xs text-muted-foreground">
                        {kpi.current.toLocaleString(locale)} / {kpi.target.toLocaleString(locale)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                        <Progress value={kpi.target > 0 ? (kpi.current / kpi.target) * 100 : 0} className="h-2 flex-1" />
                        <span className="text-sm text-muted-foreground">/</span>
                        <Input
                        id={`kpi-${kpi.id}`}
                        name={`kpi-${kpi.id}`}
                        type="number"
                        placeholder="Добавить значение"
                        className="h-8 w-[140px] text-xs"
                    />
                </div>
                 {(kpi.metrics || []).length > 0 && (
                    <CollapsibleTrigger asChild>
                        <Button variant="link" size="sm" className="p-0 h-6 text-xs mt-1 text-muted-foreground">
                            Показать записи ({kpi.metrics.length})
                            <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </Button>
                    </CollapsibleTrigger>
                )}
            </div>
            <CollapsibleContent>
                 <KpiLogList 
                    kpi={kpi} 
                    activityId={activityId} 
                    actionId={actionId} 
                    campaignId={campaignId} 
                />
            </CollapsibleContent>
        </Collapsible>
    )
}


export function UpdateMetricsForm({ activity, campaignId, actionId }: { activity: Activity, campaignId: string, actionId: string }) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const locale = 'ru-RU';
    const currencyOptions = { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 };
    
    const initialState: MetricsFormState = { message: "" };
    const [state, dispatch] = useActionState(updateActivityMetrics, initialState);

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
                <div className='flex justify-between items-center'>
                    <Label className="text-base font-medium">Бюджет</Label>
                    <AddExpenseButton activityId={activity.id} campaignId={campaignId} actionId={actionId}/>
                </div>

                <div className="text-sm text-muted-foreground mt-1 mb-2">
                    {new Intl.NumberFormat(locale, currencyOptions).format(activity.spent)} / {new Intl.NumberFormat(locale, currencyOptions).format(activity.budget)}
                </div>
                <Progress value={budgetProgress} indicatorClassName={budgetProgress > 100 ? 'bg-destructive' : 'bg-primary'} />
            </div>

            <Separator />
            
            {/* KPI Section */}
            <div>
                <div className="flex justify-between items-center">
                    <Label className="text-base font-medium">Добавить данные KPI</Label>
                     <div className="flex items-center gap-2">
                        <KpiHistoryModal activity={activity} campaignId={campaignId} actionId={actionId} />
                        <SubmitButton />
                    </div>
                </div>
                <div className="space-y-4 mt-2">
                    {activity.kpis && activity.kpis.length > 0 ? (
                        activity.kpis.map(kpi => (
                           <KpiItem 
                             key={kpi.id} 
                             kpi={kpi} 
                             campaignId={campaignId} 
                             actionId={actionId} 
                             activityId={activity.id}
                             locale={locale}
                           />
                        ))
                    ) : (
                         <p className="text-xs text-center text-muted-foreground py-2">KPI не добавлены.</p>
                    )}
                </div>
            </div>
        </form>
    );
}
