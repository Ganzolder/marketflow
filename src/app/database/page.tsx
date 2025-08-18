

import { PageHeader } from "@/components/page-header";
import { getCampaigns, getAllSocialPosts } from "@/lib/data";
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
import { StatusBadge } from "@/components/status-badge";
import { ArrowRight, Calendar, Share2, Target } from "lucide-react";
import type { Action, Activity, Campaign, SocialPost } from "@/lib/types";
import { UpdateCampaignStatus } from "../campaigns/update-campaign-status";
import { ClearDatabaseButton } from "./clear-database-button";
import { DeleteCampaignButton } from "./delete-campaign-button";
import { DeleteSocialPostButton } from "../campaigns/[id]/[actionId]/delete-social-post-button";


const DataItem = ({ label, value, children }: { label: string, value?: string | React.ReactNode, children?: React.ReactNode }) => (
    <div className="flex justify-between items-center text-sm py-1">
        <span className="text-muted-foreground">{label}</span>
        {children ? <div className="text-right">{children}</div> : <span className="font-medium text-right">{value}</span>}
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

const SocialPostCard = ({ post }: { post: SocialPost }) => {
    const locale = 'ru-RU';
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                 <CardTitle className="text-base">{post.title}</CardTitle>
                 <DeleteSocialPostButton postId={post.id} campaignId={post.campaignId || ''} actionId={post.actionId || ''}/>
            </CardHeader>
            <CardContent>
                <div className="space-y-1 text-xs">
                     <DataItem label="ID" value={<Badge variant="secondary" className="font-mono">{post.id}</Badge>} />
                     <DataItem label="Кампания ID" value={<Badge variant="outline" className="font-mono">{post.campaignId || '—'}</Badge>} />
                     <DataItem label="Акция ID" value={<Badge variant="outline" className="font-mono">{post.actionId || '—'}</Badge>} />
                     <DataItem label="Статус"><StatusBadge status={post.status} /></DataItem>
                     <DataItem label="Дата" value={new Date(post.publicationDate).toLocaleDateString(locale)} />
                </div>
            </CardContent>
        </Card>
    );
};

export default async function DatabasePage() {
  const campaigns = await getCampaigns();
  const socialPosts = await getAllSocialPosts();
  const locale = 'ru-RU';

  return (
    <div>
      <PageHeader
        title="База данных"
        description="Визуальное представление всех кампаний и их вложенных сущностей для просмотра и отладки."
      >
        <ClearDatabaseButton />
      </PageHeader>
      <Accordion type="multiple" className="w-full space-y-4">
        <AccordionItem value="campaigns">
            <AccordionTrigger className="hover:no-underline text-xl font-bold">
                 Кампании ({campaigns.length})
            </AccordionTrigger>
            <AccordionContent>
                {campaigns.length > 0 ? (
                    campaigns.map((campaign) => (
                    <Accordion type="single" collapsible className="w-full mt-4 border rounded-lg px-4" key={campaign.id}>
                        <AccordionItem value={campaign.id}>
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-left">
                                    <h3 className="text-lg font-semibold">{campaign.name}</h3>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-6 pl-2">
                                    <Card className="bg-muted/30">
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <CardTitle className="text-base">Информация о кампании</CardTitle>
                                            <DeleteCampaignButton campaignId={campaign.id} />
                                        </CardHeader>
                                        <CardContent className="space-y-1">
                                            <DataItem label="ID" value={<Badge variant="secondary" className="font-mono">{campaign.id}</Badge>} />
                                            <DataItem label="Описание" value={campaign.description} />
                                            <DataItem label="Бюджет" value={new Intl.NumberFormat(locale, { style: 'currency', currency: 'RUB' }).format(campaign.budget)} />
                                            <DataItem label="Даты" value={`${new Date(campaign.startDate).toLocaleDateString(locale)} - ${new Date(campaign.endDate).toLocaleDateString(locale)}`} />
                                            <DataItem label="Статус">
                                                <UpdateCampaignStatus campaign={campaign} />
                                            </DataItem>
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
                    </Accordion>
                    ))
                ) : (
                    <Card>
                        <CardContent className="py-10">
                            <div className="text-center text-sm text-muted-foreground">
                                Нет кампаний для отображения.
                            </div>
                        </CardContent>
                    </Card>
                )}
            </AccordionContent>
        </AccordionItem>
        <AccordionItem value="social-posts">
             <AccordionTrigger className="hover:no-underline text-xl font-bold">
                 <span className="flex items-center gap-2"><Share2 className="w-5 h-5"/>Социальные посты ({socialPosts.length})</span>
            </AccordionTrigger>
             <AccordionContent>
                {socialPosts.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {socialPosts.map(post => <SocialPostCard key={post.id} post={post} />)}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-10">
                            <div className="text-center text-sm text-muted-foreground">
                                Нет постов для отображения.
                            </div>
                        </CardContent>
                    </Card>
                )}
            </AccordionContent>
        </AccordionItem>
      </Accordion>
      {campaigns.length === 0 && socialPosts.length === 0 && (
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
