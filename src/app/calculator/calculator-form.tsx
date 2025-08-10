"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { ArrowDown, BarChart, TrendingUp, Users } from 'lucide-react';

export function CalculatorForm() {
    const [investment, setInvestment] = useState<number | ''>('');
    const [revenue, setRevenue] = useState<number | ''>('');
    const [conversions, setConversions] = useState<number | ''>('');

    const investmentValue = Number(investment) || 0;
    const revenueValue = Number(revenue) || 0;
    const conversionsValue = Number(conversions) || 0;

    const roi = investmentValue > 0 ? ((revenueValue - investmentValue) / investmentValue) * 100 : 0;
    const cpa = conversionsValue > 0 ? investmentValue / conversionsValue : 0;

    return (
        <div className="grid lg:grid-cols-2 gap-8 items-start">
            <Card>
                <CardHeader>
                    <CardTitle>Метрики кампании</CardTitle>
                    <CardDescription>Введите данные вашей кампании для расчета эффективности.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="investment">Общие инвестиции ($)</Label>
                        <Input 
                            id="investment" 
                            type="number" 
                            placeholder="например, 5000" 
                            value={investment}
                            onChange={(e) => setInvestment(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="revenue">Общий доход ($)</Label>
                        <Input 
                            id="revenue" 
                            type="number" 
                            placeholder="например, 20000"
                            value={revenue}
                            onChange={(e) => setRevenue(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="conversions">Общие конверсии (например, продажи, регистрации)</Label>
                        <Input 
                            id="conversions" 
                            type="number" 
                            placeholder="например, 150"
                            value={conversions}
                            onChange={(e) => setConversions(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" onClick={() => {
                        setInvestment('');
                        setRevenue('');
                        setConversions('');
                    }}>
                        Сбросить
                    </Button>
                </CardFooter>
            </Card>

            <div className="sticky top-24">
                <Card className="bg-primary/5 dark:bg-primary/10 border-primary/20">
                    <CardHeader>
                        <CardTitle>Результаты</CardTitle>
                        <CardDescription>Ключевые показатели эффективности на основе ваших данных.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Возврат на инвестиции (ROI)</p>
                                <p className={`text-3xl font-bold ${roi >= 0 ? 'text-accent' : 'text-destructive'}`}>
                                    {roi.toFixed(2)}%
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Стоимость привлечения клиента (CPA)</p>
                                <p className="text-3xl font-bold">
                                    ${cpa.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
