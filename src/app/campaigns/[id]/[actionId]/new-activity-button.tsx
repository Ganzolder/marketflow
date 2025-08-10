
"use client";

import { useState, useEffect, useRef, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Loader2, Trash2, GripVertical } from "lucide-react";
import { addActivityToAction } from '@/lib/actions';
import type { ActivityFormState } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


const KpiSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Название KPI обязательно."),
    target: z.coerce.number().min(1, "Цель должна быть больше 0."),
    unit: z.string().min(1, "Укажите единицу измерения."),
    parentId: z.string().nullable(),
});

const AddActivityFormSchema = z.object({
    name: z.string().min(3, "Название активности должно содержать не менее 3 символов."),
    description: z.string().optional(),
    budget: z.coerce.number().min(0, "Бюджет не может быть отрицательным."),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Неверный формат даты начала."),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Неверный формат даты окончания."),
    kpis: z.array(KpiSchema).optional(),
});


export function NewActivityButton({ campaignId, actionId }: { campaignId: string, actionId: string }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    
    const form = useForm<z.infer<typeof AddActivityFormSchema>>({
        resolver: zodResolver(AddActivityFormSchema),
        defaultValues: {
            name: "",
            description: "",
            budget: 0,
            kpis: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "kpis",
    });

    const kpis = form.watch('kpis');

    async function onSubmit(values: z.infer<typeof AddActivityFormSchema>) {
        const formData = new FormData();
        formData.append('campaignId', campaignId);
        formData.append('actionId', actionId);
        formData.append('activity-name', values.name);
        formData.append('description', values.description || '');
        formData.append('budget', values.budget.toString());
        formData.append('start-date', values.startDate);
        formData.append('end-date', values.endDate);
        formData.append('kpis', JSON.stringify(values.kpis || []));

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
            <DialogContent className="sm:max-w-[725px]">
                <DialogHeader>
                    <DialogTitle>Создать новую активность</DialogTitle>
                    <DialogDescription>
                        Заполните информацию о новой активности для вашей акции.
                    </DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                         <div className="grid gap-4 py-4">
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                            {/* KPIs Section */}
                            <div className="space-y-4 pt-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-medium">KPIs</h4>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => append({ id: `kpi-${Date.now()}`, name: '', target: 0, unit: '', parentId: null })}
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Добавить KPI
                                    </Button>
                                </div>
                                {fields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-[auto_1fr_1fr] gap-2 items-start p-3 border rounded-lg">
                                        <div className="flex flex-col gap-2 col-span-3 pb-2 mb-2 border-b">
                                            <FormField
                                                control={form.control}
                                                name={`kpis.${index}.name`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Название KPI</FormLabel>
                                                        <FormControl><Input {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                         <div className="grid gap-2">
                                             <FormField
                                                control={form.control}
                                                name={`kpis.${index}.target`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Цель</FormLabel>
                                                        <FormControl><Input type="number" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                         <div className="grid gap-2">
                                            <FormField
                                                control={form.control}
                                                name={`kpis.${index}.unit`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Ед. изм.</FormLabel>
                                                        <FormControl><Input placeholder="напр. показы" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <FormField
                                                control={form.control}
                                                name={`kpis.${index}.parentId`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Родитель</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Нет" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="null">Нет</SelectItem>
                                                                {kpis.filter(kpi => kpi.id !== field.id).map(kpi => (
                                                                    <SelectItem key={kpi.id} value={kpi.id}>{kpi.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="col-span-3 flex justify-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter>
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

