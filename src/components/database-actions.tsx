
"use client";

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, Download, Loader2, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportDatabase, importDatabase } from '@/lib/actions';
import { saveAs } from 'file-saver';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useRouter } from 'next/navigation';

export function DatabaseActions() {
    const [open, setOpen] = useState(false);
    const [isExporting, startExportTransition] = useTransition();
    const [isImporting, startImportTransition] = useTransition();
    const [file, setFile] = useState<File | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const handleExport = () => {
        startExportTransition(async () => {
            const result = await exportDatabase();
            if (result.error) {
                toast({
                    variant: "destructive",
                    title: "Ошибка экспорта",
                    description: result.error,
                });
            } else if (result.buffer) {
                const blob = new Blob([new Uint8Array(result.buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                saveAs(blob, `marketflow_backup_${new Date().toISOString().split('T')[0]}.xlsx`);
                toast({
                    title: "Экспорт успешен",
                    description: "Данные были успешно выгружены в Excel-файл.",
                });
                setOpen(false);
            }
        });
    };

    const handleImport = () => {
        if (!file) {
            toast({
                variant: "destructive",
                title: "Файл не выбран",
                description: "Пожалуйста, выберите файл для импорта.",
            });
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const data = event.target?.result;
            if (data instanceof ArrayBuffer) {
                startImportTransition(async () => {
                    const result = await importDatabase(new Uint8Array(data));
                    if (result.error) {
                        toast({
                            variant: "destructive",
                            title: "Ошибка импорта",
                            description: result.message,
                        });
                    } else {
                        toast({
                            title: "Импорт успешен",
                            description: result.message,
                        });
                        setOpen(false);
                        setFile(null);
                        router.refresh();
                    }
                });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full">
                   <Database />
                   <span>Импорт/Экспорт данных</span>
                </button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Управление данными</DialogTitle>
                    <DialogDescription>
                        Вы можете выгрузить все данные в Excel-файл или загрузить их из файла. При импорте все текущие данные будут заменены.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Button onClick={handleExport} disabled={isExporting} className="w-full">
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Экспорт в Excel
                    </Button>
                    <div className="space-y-2">
                        <Label htmlFor="import-file">Импорт из Excel</Label>
                        <div className="flex gap-2">
                            <Input id="import-file" type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={isImporting} />
                            <Button onClick={handleImport} disabled={isImporting || !file}>
                                {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                Импорт
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
