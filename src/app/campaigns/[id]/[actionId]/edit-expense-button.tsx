
"use client";

import { useState, useEffect, useActionState, useRef, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Loader2 } from "lucide-react";
import { updateExpense, type ExpenseFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Progress } from '@/components/ui/progress';
import type { Expense, Activity } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

export function EditExpenseButton({ expense, campaignId, actionId, activities, originalActivityId }: { expense: Expense, campaignId: string; actionId: string; activities: Activity[], originalActivityId?: string }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    
    const [file, setFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [isPending, startTransition] = useTransition();

    const initialState: ExpenseFormState = { message: "", errors: {} };
    const [state, dispatch] = useActionState(updateExpense, initialState);
    
    useEffect(() => {
        if (state?.message && !isPending && !isUploading) {
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
                setOpen(false);
                setFile(null);
                setUploadProgress(0);
            }
        }
    }, [state, isPending, isUploading, toast]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        } else {
            setFile(null);
        }
    };
    
    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        startTransition(async () => {
            const formData = new FormData(formRef.current!);
            let fileUrl = formData.get('photoURL_text') as string || '';

            if (file) {
                setIsUploading(true);
                setUploadProgress(0);
                
                try {
                    const storageRef = ref(storage, `expense_proofs/${campaignId}/${actionId}/${Date.now()}_${file.name}`);
                    const uploadTask = uploadBytesResumable(storageRef, file);

                    fileUrl = await new Promise<string>((resolve, reject) => {
                        uploadTask.on('state_changed',
                            (snapshot) => {
                                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                setUploadProgress(progress);
                            },
                            (error) => {
                                console.error("Upload failed:", error);
                                reject(error);
                            },
                            async () => {
                                try {
                                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                                    resolve(downloadURL);
                                } catch(e) {
                                    reject(e);
                                }
                            }
                        );
                    });
                } catch (error) {
                    toast({ variant: "destructive", title: "Ошибка загрузки", description: "Не удалось загрузить файл." });
                    setIsUploading(false);
                    return;
                } finally {
                    setIsUploading(false);
                }
            }
            
            formData.set('photoURL', fileUrl);
            formData.delete('photoURL_text');
            dispatch(formData);
        });
    }

    const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={stopPropagation}>
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent onClick={stopPropagation} className="h-[90vh] flex flex-col sm:h-auto sm:max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle>Редактировать расход</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleFormSubmit} ref={formRef} className="flex-1 flex flex-col min-h-0">
                    <ScrollArea className="flex-1 pr-6 -mr-6">
                        <div className="grid gap-4 py-4 pr-6">
                            <div className="grid gap-2">
                                <Label htmlFor="activityId">Привязка к активности</Label>
                                <Select name="activityId" defaultValue={originalActivityId || 'general'}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите активность" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">Общий расход</SelectItem>
                                        {activities.map(activity => (
                                            <SelectItem key={activity.id} value={activity.id}>{activity.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Описание</Label>
                                <Textarea id="description" name="description" defaultValue={expense.description} />
                                {state?.errors?.description && <p className="text-sm text-destructive">{state.errors.description[0]}</p>}
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="amount">Сумма (р.)</Label>
                                    <Input id="amount" name="amount" type="number" defaultValue={expense.amount} />
                                    {state?.errors?.amount && <p className="text-sm text-destructive">{state.errors.amount[0]}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="date">Дата</Label>
                                    <Input id="date" name="date" type="date" defaultValue={expense.date} />
                                    {state?.errors?.date && <p className="text-sm text-destructive">{state.errors.date[0]}</p>}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="legalEntity">Юр. лицо (необязательно)</Label>
                                <Input id="legalEntity" name="legalEntity" defaultValue={expense.legalEntity} />
                                {state?.errors?.legalEntity && <p className="text-sm text-destructive">{state.errors.legalEntity[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="photoFile">Загрузить новый файл</Label>
                                <Input id="photoFile" name="photoFile" type="file" onChange={handleFileChange} disabled={isUploading || isPending} />
                                {isUploading && (
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Загрузка...</p>
                                        <Progress value={uploadProgress} className="h-2" />
                                    </div>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="photoURL_text">Или вставьте URL</Label>
                                <Input id="photoURL_text" name="photoURL_text" type="text" defaultValue={expense.photoURL || ''} placeholder="https://example.com/image.png" disabled={isUploading || isPending || !!file} />
                                {state?.errors?.photoURL && <p className="text-sm text-destructive">{state.errors.photoURL[0]}</p>}
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="mt-auto pt-4 border-t">
                        <input type="hidden" name="campaignId" value={campaignId} />
                        <input type="hidden" name="actionId" value={actionId} />
                        <input type="hidden" name="expenseId" value={expense.id} />
                        <input type="hidden" name="originalActivityId" value={originalActivityId || 'general'} />
                        <DialogClose asChild>
                            <Button variant="outline" type="button">Отмена</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isUploading || isPending}>
                            {(isUploading || isPending) ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Сохранение...</> : "Сохранить"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
