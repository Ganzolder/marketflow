
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Edit2, PlusCircle, Trash2, TrendingUp, CircleDollarSign } from "lucide-react";
import { updateActivity } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { Activity } from '@/lib/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFieldArray } from 'react-hook-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';


const KpiSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Название KPI обязательно."),
    target: z.coerce.number().min(1, "Цель должна быть больше 0."),
    current: z.coerce.number(), // Not editable in this form, but needed for type consistency
    unit: z.string().min(1, "Укажите единицу измерения."),
    multiple: z.coerce.number().min(1, "Кратность должна быть больше 0."),
    parentId: z.string().nullable(),
    includeInActionGoals: z.boolean().optional(),
});

const EditActivityFormSchema = z.object({
    name: z.string().min(3, "Название активности должно содержать не менее 3 символов."),
    description: z.string().optional(),
    budget: z.coerce.number().min(0, "Бюджет не может быть отрицательным."),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Неверный формат даты начала."),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Неверный формат даты окончания."),
    kpis: z.array(KpiSchema).optional(),
});


export function EditActivityButton({ activity, campaignId, actionId }: { activity: Activity, campaignId: string, actionId: string }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const locale = 'ru-RU';
    const currencyOptions = { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 };
    
    const form = useForm<z.infer<typeof EditActivityFormSchema>>({
        resolver: zodResolver(EditActivityFormSchema),
        defaultValues: {
            name: activity.name,
            description: activity.description || "",
            budget: activity.budget,
            startDate: activity.startDate.split('T')[0],
            endDate: activity.endDate.split('T')[0],
            kpis: activity.kpis?.map(kpi => ({...kpi, multiple: kpi.multiple || 1, includeInActionGoals: kpi.includeInActionGoals ?? true })) || [],
        },
    });
    
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "kpis",
    });

    const kpis = form.watch('kpis');
    const budget = form.watch('budget');

    async function onSubmit(values: z.infer<typeof EditActivityFormSchema>) {
        const formData = new FormData();
        formData.append('campaignId', campaignId);
        formData.append('actionId', actionId);
        formData.append('activityId', activity.id);
        formData.append('activity-name', values.name);
        formData.append('description', values.description || '');
        formData.append('budget', values.budget.toString());
        formData.append('start-date', values.startDate);
        formData.append('end-date', values.endDate);
        formData.append('kpis', JSON.stringify(values.kpis || []));

        const result = await updateActivity(null, formData);

        if (result.error) {
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: result.message,
            });
        } else {
            toast({
                title: "Успех",
                description: result.message,
            });
            setOpen(false);
        }
    }
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Редактировать активность</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Редактировать активность</DialogTitle>
                    <DialogDescription>
                        Измените информацию об активности.
                    </DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 flex flex-col min-h-0">
                       <ScrollArea className="flex-1 -mr-6 pr-6">
                       <div className="grid md:grid-cols-2 gap-8 py-4">
                            {/* Left Column */}
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Название активности</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Описание (необязательно)</FormLabel>
                                            <FormControl><Textarea {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="budget"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Бюджет ($)</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="startDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Дата начала</FormLabel>
                                                <FormControl><Input type="date" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="endDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Дата окончания</FormLabel>
                                                <FormControl><Input type="date" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Right Column (KPIs) */}
                            <div className="flex flex-col">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-lg font-medium">KPIs</h4>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => append({ id: `kpi-${Date.now()}`, name: '', target: 0, current: 0, unit: '', multiple: 1, parentId: null, includeInActionGoals: true })}
                                        >
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Добавить KPI
                                        </Button>
                                    </div>
                                    {fields.map((field, index) => {
                                        const currentKpi = kpis?.[index];
                                        const parentKpi = kpis?.find(p => p.id === currentKpi?.parentId);
                                        const conversion = parentKpi && parentKpi.target > 0 && currentKpi && currentKpi.target > 0 ? (currentKpi.target / parentKpi.target) * 100 : null;
                                        const costPerUnit = currentKpi && currentKpi.target > 0 && budget > 0 && currentKpi.multiple > 0 ? budget / (currentKpi.target / currentKpi.multiple) : null;

                                        return (
                                        <div key={field.id} className="grid grid-cols-1 gap-4 p-4 border rounded-lg relative">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-2 right-2 h-7 w-7 text-destructive hover:text-destructive"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Удалить KPI</span>
                                            </Button>
                                            
                                            <FormField
                                                control={form.control}
                                                name={`kpis.${index}.name`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Название KPI</FormLabel>
                                                        <FormControl><Input placeholder="напр. Показы" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                                <FormField
                                                    control={form.control}
                                                    name={`kpis.${index}.target`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Цель</FormLabel>
                                                            <FormControl><Input type="number" placeholder="1000" {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`kpis.${index}.unit`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Ед. изм.</FormLabel>
                                                            <FormControl><Input placeholder="шт." {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`kpis.${index}.multiple`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Кратность</FormLabel>
                                                            <FormControl><Input type="number" placeholder="1" {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`kpis.${index}.parentId`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Родитель</FormLabel>
                                                            <Select onValueChange={(value) => field.onChange(value === 'null' ? null : value)} value={field.value || 'null'}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Нет" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="null">Нет</SelectItem>
                                                                    {kpis?.filter(kpi => kpi.id !== currentKpi?.id).map(kpi => (
                                                                        <SelectItem key={kpi.id} value={kpi.id}>{kpi.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                             <div className="flex items-center space-x-2 pt-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`kpis.${index}.includeInActionGoals`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="text-sm font-normal text-muted-foreground">
                                                                Включить в общие цели акции
                                                            </FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="flex items-center gap-4 text-muted-foreground pt-2 text-xs border-t mt-2 pt-2">
                                                {conversion !== null && parentKpi && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                        <TooltipTrigger className="flex items-center gap-1">
                                                            <TrendingUp className="w-4 h-4 text-green-500"/> 
                                                            <span className="font-bold text-green-500">{conversion.toFixed(1)}%</span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Конверсия из "{parentKpi.name}"</p>
                                                        </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                                {costPerUnit !== null && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger className="flex items-center gap-1">
                                                            <CircleDollarSign className="w-4 h-4 text-blue-500" />
                                                            <span className="font-bold text-blue-500">{new Intl.NumberFormat(locale, currencyOptions).format(costPerUnit)}</span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                            <p>Стоимость за {currentKpi?.multiple || 1} {currentKpi?.unit || 'ед.'}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                        </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                       </ScrollArea>
                        <DialogFooter className="pt-4 border-t">
                            <DialogClose asChild>
                                <Button variant="outline">Отмена</Button>
                            </DialogClose>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Сохранение...
                                    </>
                                ) : "Сохранить изменения"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
