
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Share2 } from "lucide-react";

export default function SmmPage() {
  return (
    <div>
      <PageHeader
        title="SMM Планировщик"
        description="Управляйте всеми вашими публикациями в социальных сетях в одном месте."
      />
      <Card>
        <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-12">
                <Share2 className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-semibold">Раздел в разработке</h3>
                <p className="text-sm">Эта страница скоро будет доступна. Здесь вы сможете видеть календарь публикаций и сводную аналитику.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
