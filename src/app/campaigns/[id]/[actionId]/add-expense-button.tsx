
"use client";

import { useState, useEffect, useActionState, useRef, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Loader2, UploadCloud, CheckCircle2 } from "lucide-react";
import { addExpense, type ExpenseFormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Progress } from '@/components/ui/progress';

export function AddExpenseButton({ activityId, campaignId, actionId }: { activityId: string; campaignId: string; actionId: string; }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    
    const [file, setFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [isPending, startTransition] = useTransition();

    const initialState: ExpenseFormState = { message: "", errors: {} };
    const [state, dispatch] = useActionState(addExpense, initialState);
    
    const photoURLRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isPending && state?.message) {
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
                formRef.current?.reset();
                setFile(null);
                setUploadProgress(0);
            }
        }
    }, [state, isPending, toast]);

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
            let fileUrl = '';

            if (file) {
                setIsUploading(true);
                setUploadProgress(0);
                
                try {
                    const storageRef = ref(storage, `expense_proofs/${campaignId}/${activityId}/${Date.now()}_${file.name}`);
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
                    return; // Stop submission if upload fails
                } finally {
                    setIsUploading(false);
                }
            }
            
            const formData = new FormData(formRef.current!);
            formData.set('photoURL', fileUrl);

            dispatch(formData);
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Добавить трату
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Добавить расход</DialogTitle>
                    <DialogDescription>
                        Заполните информацию о расходе для этой активности.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleFormSubmit} ref={formRef}>
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <input type="hidden" name="actionId" value={actionId} />
                    <input type="hidden" name="activityId" value={activityId} />
                    {/* The photoURL is now set via code, no need for a hidden input ref */}

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="description">Описание</Label>
                            <Textarea id="description" name="description" placeholder="например, Оплата услуг инфлюенсера" />
                            {state?.errors?.description && <p className="text-sm text-destructive">{state.errors.description[0]}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Сумма ($)</Label>
                                <Input id="amount" name="amount" type="number" placeholder="150.00" />
                                {state?.errors?.amount && <p className="text-sm text-destructive">{state.errors.amount[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="date">Дата</Label>
                                <Input id="date" name="date" type="date" />
                                {state?.errors?.date && <p className="text-sm text-destructive">{state.errors.date[0]}</p>}
                            </div>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="legalEntity">Юр. лицо (необязательно)</Label>
                            <Input id="legalEntity" name="legalEntity" placeholder="например, ООО 'Маркетинг'" />
                             {state?.errors?.legalEntity && <p className="text-sm text-destructive">{state.errors.legalEntity[0]}</p>}
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="photoFile">Фото-подтверждение</Label>
                            <Input id="photoFile" name="photoFile" type="file" onChange={handleFileChange} disabled={isUploading || isPending} />
                            {isUploading && (
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Загрузка...</p>
                                    <Progress value={uploadProgress} className="h-2" />
                                </div>
                            )}
                             {state?.errors?.photoURL && <p className="text-sm text-destructive">{state.errors.photoURL[0]}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" type="button">Отмена</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isUploading || isPending}>
                            {(isUploading || isPending) ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Добавление...</> : "Добавить расход"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
