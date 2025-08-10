"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { ArrowDown, BarChart, TrendingUp, Users } from 'lucide-react';

export function CalculatorForm() {
    const [investment, setInvestment] = useState(0);
    const [revenue, setRevenue] = useState(0);
    const [conversions, setConversions] = useState(0);

    const roi = investment > 0 ? ((revenue - investment) / investment) * 100 : 0;
    const cpa = conversions > 0 ? investment / conversions : 0;

    return (
        <div className="grid lg:grid-cols-2 gap-8 items-start">
            <Card>
                <CardHeader>
                    <CardTitle>Campaign Metrics</CardTitle>
                    <CardDescription>Enter your campaign data to calculate performance.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="investment">Total Investment ($)</Label>
                        <Input 
                            id="investment" 
                            type="number" 
                            placeholder="e.g. 5000" 
                            value={investment || ''}
                            onChange={(e) => setInvestment(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="revenue">Total Revenue ($)</Label>
                        <Input 
                            id="revenue" 
                            type="number" 
                            placeholder="e.g. 20000"
                            value={revenue || ''}
                            onChange={(e) => setRevenue(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="conversions">Total Conversions (e.g., Sales, Signups)</Label>
                        <Input 
                            id="conversions" 
                            type="number" 
                            placeholder="e.g. 150"
                            value={conversions || ''}
                            onChange={(e) => setConversions(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" onClick={() => {
                        setInvestment(0);
                        setRevenue(0);
                        setConversions(0);
                    }}>
                        Reset
                    </Button>
                </CardFooter>
            </Card>

            <div className="sticky top-24">
                <Card className="bg-primary/5 dark:bg-primary/10 border-primary/20">
                    <CardHeader>
                        <CardTitle>Results</CardTitle>
                        <CardDescription>Key performance indicators based on your input.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Return on Investment (ROI)</p>
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
                                <p className="text-sm text-muted-foreground">Cost Per Acquisition (CPA)</p>
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
