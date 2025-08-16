import { PageHeader } from "@/components/page-header";
import { getCampaigns } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default async function DatabasePage() {
  const campaigns = await getCampaigns();

  return (
    <div>
      <PageHeader
        title="База данных"
        description="Здесь отображается полное содержимое базы данных в формате JSON для просмотра и отладки."
      />
      <Card>
        <CardHeader>
          <CardTitle>Содержимое коллекции 'campaigns'</CardTitle>
          <CardDescription>
            Это все данные, которые в настоящее время хранятся в вашей базе данных Firestore.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-[60vh] w-full rounded-md border bg-muted/50">
                 <pre className="p-4 text-xs">
                    <code>{JSON.stringify(campaigns, null, 2)}</code>
                </pre>
            </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
