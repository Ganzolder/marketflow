import { PageHeader } from "@/components/page-header";
import { notFound } from "next/navigation";
import { getCampaignById } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default async function NewActionPage({ params }: { params: { id: string } }) {
  const campaign = await getCampaignById(params.id);

  if (!campaign) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title="Создать новую акцию"
        description={`Для кампании: ${campaign.name}`}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Детали акции</CardTitle>
          <CardDescription>Заполните информацию о новой акции.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="action-name">Название акции</Label>
              <Input id="action-name" placeholder="например, Весенняя распродажа" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="action-type">Тип акции</Label>
              <Input id="action-type" placeholder="например, Цифровая реклама" />
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Дата начала</Label>
              <Input id="start-date" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">Дата окончания</Label>
              <Input id="end-date" type="date" />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="status">Статус</Label>
              <Select defaultValue="planned">
                <SelectTrigger id="status">
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Запланирована</SelectItem>
                  <SelectItem value="in-progress">В процессе</SelectItem>
                  <SelectItem value="completed">Завершена</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Button variant="outline">Отмена</Button>
            <Button>Создать акцию</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
