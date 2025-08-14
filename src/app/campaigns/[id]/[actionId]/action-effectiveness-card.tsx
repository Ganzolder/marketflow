
"use client";

import { useEffect, useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, ShoppingCart, Banknote, Landmark, PiggyBank, BarChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateActionEffectiveness, type EffectivenessFormState } from '@/lib/actions';
import type { Action } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

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

type ActionEffectivenessCardProps = {
    action: Action;
    campaignId: string;
    locale: string;
    currencyOptions: Intl.NumberFormatOptions;
    totalSpent: number;
}

export function ActionEffectivenessCard({ action, campaignId, locale, currencyOptions, totalSpent }: ActionEffectivenessCardProps) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    const initialState: EffectivenessFormState = { message: "" };
    const [state, dispatch] = useActionState(updateActionEffectiveness, initialState);

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

    const salesKpiName = "Продажи";
    let plannedSales = 0;
    let actualSales = 0;

    action.activities?.forEach(activity => {
        activity.kpis?.forEach(kpi => {
            if (kpi.name === salesKpiName) {
                plannedSales += kpi.target;
                actualSales += kpi.current;
            }
        });
    });

    const plannedRevenue = plannedSales * (action.plannedAverageCheck || 0);
    const actualRevenue = actualSales * (action.actualAverageCheck || 0);
    const plannedProfit = plannedRevenue * ((action.plannedMarginality || 0) / 100);
    const actualProfit = actualRevenue * ((action.actualMarginality || 0) / 100);
    const netProfit = actualProfit - totalSpent;
    const roi = totalSpent > 0 ? (netProfit / totalSpent) * 100 : 0;


    return (
        <Card>
            <CardHeader>
                <CardTitle>Эффективность акции</CardTitle>
                <CardDescription>
                    Рассчитайте плановые и фактические показатели на основе продаж, среднего чека и маржинальности.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={dispatch} ref={formRef} className="space-y-6">
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <input type="hidden" name="actionId" value={action.id} />
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                         <div className="grid gap-2">
                            <Label htmlFor="plannedAverageCheck">Планируемый средний чек (р.)</Label>
                            <Input 
                                id="plannedAverageCheck" 
                                name="plannedAverageCheck" 
                                type="number" 
                                step="any"
                                defaultValue={action.plannedAverageCheck || ''} 
                                placeholder="150"
                            />
                            {state.errors?.plannedAverageCheck && <p className="text-sm text-destructive">{state.errors.plannedAverageCheck[0]}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="actualAverageCheck">Фактический средний чек (р.)</Label>
                            <Input 
                                id="actualAverageCheck" 
                                name="actualAverageCheck" 
                                type="number"
                                step="any"
                                defaultValue={action.actualAverageCheck || ''}
                                placeholder="165"
                             />
                             {state.errors?.actualAverageCheck && <p className="text-sm text-destructive">{state.errors.actualAverageCheck[0]}</p>}
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="plannedMarginality">Плановая маржинальность (%)</Label>
                            <Input 
                                id="plannedMarginality" 
                                name="plannedMarginality" 
                                type="number" 
                                step="any"
                                defaultValue={action.plannedMarginality || ''} 
                                placeholder="25"
                                max="100"
                            />
                            {state.errors?.plannedMarginality && <p className="text-sm text-destructive">{state.errors.plannedMarginality[0]}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="actualMarginality">Фактическая маржинальность (%)</Label>
                            <Input 
                                id="actualMarginality" 
                                name="actualMarginality" 
                                type="number"
                                step="any"
                                defaultValue={action.actualMarginality || ''}
                                placeholder="28"
                                max="100"
                             />
                             {state.errors?.actualMarginality && <p className="text-sm text-destructive">{state.errors.actualMarginality[0]}</p>}
                        </div>
                    </div>
                    
                    <div className="flex justify-end">
                        <SubmitButton />
                    </div>
                </form>

                <Separator className="my-6" />

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <ShoppingCart className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Плановая выручка</p>
                             <p className="text-2xl font-bold">
                                {new Intl.NumberFormat(locale, currencyOptions).format(plannedRevenue)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {plannedSales.toLocaleString(locale)} продаж по {new Intl.NumberFormat(locale, currencyOptions).format(action.plannedAverageCheck || 0)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="p-3 bg-accent/10 rounded-lg">
                            <Banknote className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Фактическая выручка</p>
                            <p className="text-2xl font-bold text-accent">
                                {new Intl.NumberFormat(locale, currencyOptions).format(actualRevenue)}
                            </p>
                             <p className="text-xs text-muted-foreground">
                                {actualSales.toLocaleString(locale)} продаж по {new Intl.NumberFormat(locale, currencyOptions).format(action.actualAverageCheck || 0)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <Landmark className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Плановая прибыль</p>
                             <p className="text-2xl font-bold">
                                {new Intl.NumberFormat(locale, currencyOptions).format(plannedProfit)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {action.plannedMarginality || 0}% маржинальность
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="p-3 bg-accent/10 rounded-lg">
                            <Landmark className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Фактическая прибыль</p>
                            <p className="text-2xl font-bold text-accent">
                                {new Intl.NumberFormat(locale, currencyOptions).format(actualProfit)}
                            </p>
                             <p className="text-xs text-muted-foreground">
                                {action.actualMarginality || 0}% маржинальность
                            </p>
                        </div>
                    </div>
                </div>
                
                <Separator className="my-6" />

                <div className="grid md:grid-cols-2 gap-6">
                     <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="p-3 bg-accent/10 rounded-lg">
                            <PiggyBank className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Итоговая прибыль (после расходов)</p>
                            <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-accent' : 'text-destructive'}`}>
                                {new Intl.NumberFormat(locale, currencyOptions).format(netProfit)}
                            </p>
                             <p className="text-xs text-muted-foreground">
                                {new Intl.NumberFormat(locale, currencyOptions).format(actualProfit)} (прибыль) - {new Intl.NumberFormat(locale, currencyOptions).format(totalSpent)} (расходы)
                            </p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="p-3 bg-accent/10 rounded-lg">
                            <BarChart className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Возврат на инвестиции (ROI)</p>
                            <p className={`text-2xl font-bold ${roi >= 0 ? 'text-accent' : 'text-destructive'}`}>
                                {roi.toFixed(1)}%
                            </p>
                             <p className="text-xs text-muted-foreground">
                                На основе итоговой прибыли и расходов
                            </p>
                        </div>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
