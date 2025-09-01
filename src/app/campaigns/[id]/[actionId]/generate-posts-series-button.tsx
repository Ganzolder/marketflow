
"use client";

import { useState, useActionState, useRef, useTransition, useEffect } from 'react';
import type { Action, SocialPlatform } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { generatePostSeriesAction, type GeneratePostSeriesState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SocialPlatforms } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Loader2, Wand2 } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Input } from '@/components/ui/input';

export function GeneratePostsSeriesButton({ action, campaignId }: { action: Action, campaignId: string }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, startTransition] = useTransition();
    
    const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
    const [selectedDates, setSelectedDates] = useState<Date[] | undefined>();

    const initialState: GeneratePostSeriesState = { message: "", errors: {} };
    const [state, dispatch] = useActionState(generatePostSeriesAction, initialState);

    useEffect(() => {
        if (state.message && !isPending) {
            if (state.error) {
                const errorMessages = state.errors ? Object.values(state.errors).flat().join("\n") : state.message;
                toast({ variant: "destructive", title: "Ошибка", description: errorMessages });
            } else {
                toast({ title: "Успех", description: state.message });
                setOpen(false);
                formRef.current?.reset();
                setSelectedPlatforms([]);
                setSelectedDates(undefined);
            }
        }
    }, [state, isPending, toast]);


    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        
        selectedPlatforms.forEach(p => formData.append('platforms', p));
        
        const formattedDates = selectedDates?.map(date => format(date, 'yyyy-MM-dd')) || [];
        formData.append('dates', formattedDates.join(','));

        startTransition(() => {
            dispatch(formData);
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Сгенерировать серию постов
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Генератор серии постов для акции: {action.name}</DialogTitle>
                    <DialogDescription>
                        Выберите даты и платформы, добавьте детали, и ИИ создаст серию постов с уникальными промокодами.
                    </DialogDescription>
                </DialogHeader>
                <form ref={formRef} onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="additionalInfo">Дополнительная информация</Label>
                                <Textarea 
                                    id="additionalInfo" 
                                    name="additionalInfo" 
                                    placeholder="Например, 'Сфокусироваться на водонепроницаемости нового чехла' или 'Упомянуть бесплатную доставку'."
                                    rows={4}
                                />
                                {state.errors?.additionalInfo && <p className="text-sm text-destructive mt-1">{state.errors.additionalInfo[0]}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="plannedReach">Плановый охват (на пост)</Label>
                                    <Input id="plannedReach" name="plannedReach" type="number" placeholder="10000" />
                                    {state.errors?.plannedReach && <p className="text-sm text-destructive mt-1">{state.errors.plannedReach[0]}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="plannedComments">Плановые комментарии (на пост)</Label>
                                    <Input id="plannedComments" name="plannedComments" type="number" placeholder="50" />
                                    {state.errors?.plannedComments && <p className="text-sm text-destructive mt-1">{state.errors.plannedComments[0]}</p>}
                                </div>
                            </div>
                            <div>
                                <Label>Платформы</Label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                {SocialPlatforms.map(platform => (
                                    <Label key={platform} className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent/50 cursor-pointer border">
                                        <Checkbox
                                            checked={selectedPlatforms.includes(platform)}
                                            onCheckedChange={(checked) => {
                                                return checked
                                                    ? setSelectedPlatforms(prev => [...prev, platform])
                                                    : setSelectedPlatforms(prev => prev.filter(p => p !== platform))
                                            }}
                                        />
                                        <span>{platform}</span>
                                    </Label>
                                ))}
                                </div>
                                 {state.errors?.platforms && <p className="text-sm text-destructive mt-1">{state.errors.platforms[0]}</p>}
                            </div>
                        </div>
                        <div className="space-y-2">
                             <Label>Даты публикаций</Label>
                             <div className="flex justify-center rounded-md border">
                                <Calendar
                                    mode="multiple"
                                    selected={selectedDates}
                                    onSelect={setSelectedDates}
                                />
                             </div>
                             {state.errors?.dates && <p className="text-sm text-destructive mt-1">{state.errors.dates[0]}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <input type="hidden" name="campaignId" value={campaignId} />
                        <input type="hidden" name="actionId" value={action.id} />
                        <DialogClose asChild><Button type="button" variant="outline">Отмена</Button></DialogClose>
                        <Button type="submit" disabled={isPending}>
                             {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Генерация...</> : 'Создать посты'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
