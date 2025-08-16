
import { PageHeader } from "@/components/page-header";
import { getCampaigns } from "@/lib/data";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { ArrowRight, Calendar, Landmark, Target } from "lucide-react";
import type { Action, Activity, Campaign } from "@/lib/types";


const DataItem = ({ label, value }: { label: string, value: string | React.ReactNode }) => (
    <div className="flex justify-between items-center text-sm py-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-right">{value}</span>
    </div>
)


const ActivityCard = ({ activity }: { activity: Activity }) => (
    <Card className="bg-background/50">
        <CardHeader className="p-3">
            <CardTitle className="text-sm">{activity.name}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 text-xs space-y-2">
            <DataItem label="Бюджет" value={`${activity.budget.toLocaleString()} ₽`} />
            <DataItem label="Потрачено" value={`${activity.spent.toLocaleString()} ₽`} />
             <DataItem label="KPIs" value={activity.kpis?.length || 0} />
             <DataItem label="Расходы" value={activity.expenses?.length || 0} />
        </CardContent>
    </Card>
)

const ActionCard = ({ action }: { action: Action }) => (
     <Card>
        <CardHeader>
            <CardTitle className="flex justify-between items-center">
                <span>{action.name}</span>
                <StatusBadge status={action.status} />
            </CardTitle>
            <CardDescription>
                <div className="flex items-center gap-4 text-xs pt-2">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(action.startDate).toLocaleDateString()} <ArrowRight className="w-3.5 h-3.5" /> {new Date(action.endDate).toLocaleDateString()}</span>
                     <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> {action.targetAudience || 'Не указана'}</span>
                </div>
            </CardDescription>
        </CardHeader>
        <CardContent>
            <h4 className="font-semibold mb-2 text-sm">Активности ({action.activities?.length || 0})</h4>
             {action.activities && action.activities.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {action.activities.map(activity => <ActivityCard key={activity.id} activity={activity} />)}
                </div>
            ) : (
                <p className="text-xs text-muted-foreground">Нет активностей.</p>
            )}
        </CardContent>
    </Card>
)

export default async function DatabasePage() {
  const campaigns = await getCampaigns();
  const locale = 'ru-RU';

  return (
    <div>
      <PageHeader
        title="База данных"
        description="Визуальное представление всех кампаний и их вложенных сущностей для просмотра и отладки."
      />
      <Accordion type="single" collapsible className="w-full">
        {campaigns.map((campaign) => (
          <AccordionItem value={campaign.id} key={campaign.id}>
            <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-left">
                    <h3 className="text-lg font-semibold">{campaign.name}</h3>
                    <StatusBadge status={campaign.status} />
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-6 pl-2">
                    <Card className="bg-muted/30">
                        <CardHeader>
                            <CardTitle className="text-base">Информация о кампании</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <DataItem label="ID" value={<Badge variant="secondary" className="font-mono">{campaign.id}</Badge>} />
                            <DataItem label="Описание" value={campaign.description} />
                            <DataItem label="Бюджет" value={new Intl.NumberFormat(locale, { style: 'currency', currency: 'RUB' }).format(campaign.budget)} />
                            <DataItem label="Даты" value={`${new Date(campaign.startDate).toLocaleDateString(locale)} - ${new Date(campaign.endDate).toLocaleDateString(locale)}`} />
                        </CardContent>
                    </Card>
                    
                    <div className="space-y-4">
                         <h4 className="font-semibold">Акции ({campaign.actions?.length || 0})</h4>
                         {campaign.actions && campaign.actions.length > 0 ? (
                             <div className="space-y-4">
                                {campaign.actions.map(action => <ActionCard key={action.id} action={action} />)}
                            </div>
                         ) : (
                            <p className="text-sm text-muted-foreground">В этой кампании нет акций.</p>
                         )}
                    </div>
                </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {campaigns.length === 0 && (
         <Card>
            <CardContent className="py-10">
                <div className="text-center text-sm text-muted-foreground">
                База данных пуста. Создайте новую кампанию, чтобы начать.
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
