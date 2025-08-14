

"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Loader2, Trash2, TrendingUp, CircleDollarSign, Info } from "lucide-react";
import { addActivityToAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useFieldArray } from 'react-hook-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { getUniqueKpiNames } from '@/lib/data';


const KpiSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Название KPI обязательно."),
    target: z.coerce.number().min(1, "Цель должна быть больше 0."),
    current: z.coerce.number(),
    parentId: z.string().nullable(),
    includeInActionGoals: z.boolean().optional(),
});

const AddActivityFormSchema = z.object({
    name: z.string().min(3, "Название активности должно содержать не менее 3 символов."),
    description: z.string().optional(),
    trackingMethod: z.string().optional(),
    budget: z.coerce.number().min(0, "Бюджет не может быть отрицательным."),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Неверный формат даты начала."),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Неверный формат даты окончания."),
    kpis: z.array(KpiSchema).optional(),
});


export function NewActivityButton({ campaignId, actionId }: { campaignId: string, actionId: string }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const locale = 'ru-RU';
    const currencyOptions = { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 };
    const [kpiOptions, setKpiOptions] = useState<{value: string, label: string}[]>([]);

    useEffect(() => {
        if (open) {
            getUniqueKpiNames(campaignId).then(setKpiOptions);
        }
    }, [open, campaignId]);
    
    const form = useForm<z.infer<typeof AddActivityFormSchema>>({
        resolver: zodResolver(AddActivityFormSchema),
        defaultValues: {
            name: "",
            description: "",
            trackingMethod: "",
            budget: 0,
            startDate: "",
            endDate: "",
            kpis: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "kpis",
    });

    const kpis = form.watch('kpis');
    const budget = form.watch('budget');

    async function onSubmit(values: z.infer<typeof AddActivityFormSchema>) {
        const formData = new FormData();
        formData.append('campaignId', campaignId);
        formData.append('actionId', actionId);
        formData.append('activity-name', values.name);
        formData.append('description', values.description || '');
        formData.append('trackingMethod', values.trackingMethod || '');
        formData.append('budget', values.budget.toString());
        formData.append('start-date', values.startDate);
        formData.append('end-date', values.endDate);
        formData.append('kpis', JSON.stringify(values.kpis?.map(kpi => ({...kpi, current: 0, includeInActionGoals: kpi.includeInActionGoals ?? true })) || []));

        const result = await addActivityToAction(null, formData);

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
            form.reset();
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Добавить активность
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] h-[85vh] flex flex-col overflow-hidden">
                <DialogHeader className="shrink-0">
                    <DialogTitle>Создать новую активность</DialogTitle>
                    <DialogDescription>
                        Заполните информацию о новой активности для вашей акции.
                    </DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0 gap-4">
                    <ScrollArea className="flex-1 min-h-0 pr-6 -mr-6">
                            <div className="grid md:grid-cols-2 gap-8 py-4">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Название активности</FormLabel>
                                                <FormControl><Input placeholder="например, Конкурс в Instagram" {...field} /></FormControl>
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
                                                <FormControl><Textarea placeholder="Опишите детали активности..." {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="trackingMethod"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    Способ отслеживания
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger type="button">
                                                                <Info className="w-4 h-4 text-muted-foreground" />
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-xs text-left">
                                                                <p className="font-bold">Примеры способов отслеживания:</p>
                                                                <ul className="list-disc list-inside mt-1 text-xs text-muted-foreground space-y-1">
                                                                    <li>Промокоды или уникальные купоны</li>
                                                                    <li>UTM-метки для отслеживания URL</li>
                                                                    <li>Коллтрекинг (подменные номера)</li>
                                                                    <li>QR-коды на печатных материалах</li>
                                                                    <li>Опросы клиентов ("Откуда вы о нас узнали?")</li>
                                                                    <li>Специальные посадочные страницы (лендинги)</li>
                                                                    <li>Анализ логов CRM-системы</li>
                                                                    <li>Пиксели ретаргетинга (VK, Yandex)</li>
                                                                    <li>События в Google Analytics / Yandex.Metrika</li>
                                                                    <li>Уникальные email-адреса или телефоны для акции</li>
                                                                    <li>Аналитика мобильных приложений (AppMetrica, Firebase)</li>
                                                                </ul>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </FormLabel>
                                                <FormControl><Input placeholder="например, Промокоды" {...field} /></FormControl>
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
                                                <FormControl><Input type="number" placeholder="500" {...field} /></FormControl>
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
                                                onClick={() => append({ id: `kpi-${Date.now()}`, name: '', target: 0, current: 0, parentId: null, includeInActionGoals: true })}
                                            >
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Добавить KPI
                                            </Button>
                                        </div>
                                        {fields.map((field, index) => {
                                            const currentKpi = kpis?.[index];
                                            const parentKpi = kpis?.find(p => p.id === currentKpi?.parentId);
                                            const conversion = parentKpi && parentKpi.target > 0 && currentKpi && currentKpi.target > 0 ? (currentKpi.target / parentKpi.target) * 100 : null;
                                            const costPerUnit = currentKpi && currentKpi.target > 0 && budget > 0 ? budget / currentKpi.target : null;
                                            
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
                                                        <FormItem className="flex flex-col">
                                                            <FormLabel>Название KPI</FormLabel>
                                                              <Combobox
                                                                options={kpiOptions}
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                placeholder="Выберите или введите KPI..."
                                                                searchPlaceholder="Поиск KPI..."
                                                                notFoundText="KPI не найден."
                                                              />
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                
                                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 items-end">
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
                                                        name={`kpis.${index}.parentId`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Родитель</FormLabel>
                                                                <Select onValueChange={(value) => field.onChange(value === 'null' ? null : value)} defaultValue={field.value || 'null'}>
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
                                                <div className="space-y-2 pt-2">
                                                    <FormField
                                                        control={form.control}
                                                        name={`kpis.${index}.includeInActionGoals`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value === undefined ? true : field.value}
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
                                                {(conversion !== null || costPerUnit !== null) && (
                                                    <div className="flex items-center gap-4 text-muted-foreground pt-2 text-xs border-t mt-2 pt-2">
                                                        {conversion !== null && parentKpi && (
                                                            <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger className="flex items-center gap-1">
                                                                    <TrendingUp className="w-4 h-4 text-green-500"/> 
                                                                    <span className="font-bold text-green-500">{conversion.toFixed(1)}%</span>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                <p>Плановая конверсия из "{parentKpi.name}"</p>
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
                                                                    <p>Плановая стоимость за ед.</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                        <DialogFooter className="shrink-0 pt-4 border-t">
                            <DialogClose asChild>
                                <Button type="button" variant="outline">Отмена</Button>
                            </DialogClose>
                             <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Сохранение...
                                    </>
                                ) : "Сохранить"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
