"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitAdCopyRequest, type FormState } from "./actions";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Loader2, Wand2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Wand2 className="mr-2 h-4 w-4" />
      )}
      Создать креативы
    </Button>
  );
}

export function CreativesForm() {
  const initialState: FormState = { message: "" };
  const [state, formAction] = useFormState(submitAdCopyRequest, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message && state.issues) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: state.message,
      });
    }
    if (state.adCopies && state.adCopies.length > 0) {
      formRef.current?.reset();
    }
  }, [state, toast]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form action={formAction} ref={formRef}>
        <Card>
          <CardHeader>
            <CardTitle>Детали кампании</CardTitle>
            <CardDescription>
              Предоставьте детали для вашей рекламной кампании.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="productName">Название продукта</Label>
              <Input
                id="productName"
                name="productName"
                placeholder="например, Ноутбук 'Квантовый скачок'"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="targetAudience">Целевая аудитория</Label>
              <Input
                id="targetAudience"
                name="targetAudience"
                placeholder="например, IT-специалисты, студенты"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="campaignGoal">Цель кампании</Label>
              <Input
                id="campaignGoal"
                name="campaignGoal"
                placeholder="например, Увеличение продаж, узнаваемость бренда"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tone">Тон</Label>
              <Select name="tone" defaultValue="professional">
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тон" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Профессиональный</SelectItem>
                  <SelectItem value="humorous">Юмористический</SelectItem>
                  <SelectItem value="friendly">Дружелюбный</SelectItem>
                  <SelectItem value="luxury">Элитный</SelectItem>
                  <SelectItem value="adventurous">Авантюрный</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="keywords">Ключевые слова</Label>
              <Input
                id="keywords"
                name="keywords"
                placeholder="например, на базе ИИ, долгая батарея, легкий"
                required
              />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="numberOfVariations">Количество вариантов (1-5)</Label>
                <Input id="numberOfVariations" name="numberOfVariations" type="number" defaultValue="3" min="1" max="5" />
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </Card>
      </form>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Сгенерированный рекламный текст</CardTitle>
            <CardDescription>
              Ваш рекламный текст, созданный ИИ, появится здесь.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {state.adCopies && state.adCopies.length > 0 ? (
              state.adCopies.map((copy, index) => (
                <Card key={index} className="bg-muted/50">
                  <CardContent className="p-4 text-sm">{copy}</CardContent>
                </Card>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                <Lightbulb className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Ваши креативные идеи ждут своего часа.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
