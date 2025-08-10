
"use client";

import { useState, useEffect, useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
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

function SubmitButton({ disabled }: { disabled?: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending || disabled}>
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Добавление...</> : "Добавить расход"}
        </Button>
    )
}

export function AddExpenseButton({ activityId, campaignId, actionId }: { activityId: string; campaignId: string; actionId: string; }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    
    const [file, setFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [photoURL, setPhotoURL] = useState('');
    
    const initialState: ExpenseFormState = { message: "", errors: {} };
    const [state, dispatch] = useActionState(addExpense, initialState);

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
                setOpen(false);
                formRef.current?.reset();
                setFile(null);
                setPhotoURL('');
                setUploadProgress(0);
            }
        }
    }, [state, toast]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            handleUpload(e.target.files[0]);
        }
    };

    const handleUpload = (fileToUpload: File) => {
        if (!fileToUpload) return;

        const storageRef = ref(storage, `expense_proofs/${campaignId}/${activityId}/${Date.now()}_${fileToUpload.name}`);
        const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

        setUploading(true);
        setUploadProgress(0);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                console.error("Upload failed:", error);
                toast({ variant: "destructive", title: "Ошибка загрузки", description: "Не удалось загрузить файл." });
                setUploading(false);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    setPhotoURL(downloadURL);
                    setUploading(false);
                });
            }
        );
    };

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
                <form action={dispatch} ref={formRef}>
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <input type="hidden" name="actionId" value={actionId} />
                    <input type="hidden" name="activityId" value={activityId} />
                    <input type="hidden" name="photoURL" value={photoURL} />

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
                            <Input id="photoFile" type="file" onChange={handleFileChange} disabled={uploading} />
                            {uploading && (
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Загрузка...</p>
                                    <Progress value={uploadProgress} className="h-2" />
                                </div>
                            )}
                            {photoURL && !uploading && (
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>Файл успешно загружен.</span>
                                </div>
                            )}
                             {state?.errors?.photoURL && <p className="text-sm text-destructive">{state.errors.photoURL[0]}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Отмена</Button>
                        </DialogClose>
                        <SubmitButton disabled={uploading} />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
