
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { PageHeader } from '@/components/page-header';
import { getCampaigns } from '@/lib/data';
import { UpdateCampaignStatus } from './update-campaign-status';
import { Progress } from '@/components/ui/progress';
import { CampaignStatusFilter } from './campaign-status-filter';
import type { CampaignStatus } from '@/lib/types';
import { EditCampaignButton } from './edit-campaign-button';
import { DeleteCampaignButton } from './delete-campaign-button';
import { NewCampaignButton } from './new-campaign-button';
import { Separator } from '@/components/ui/separator';
import { Calendar, Landmark } from 'lucide-react';

type CampaignsPageProps = {
  searchParams: {
    status?: CampaignStatus;
  }
}

export default async function CampaignsPage({ searchParams }: CampaignsPageProps) {
  const campaigns = await getCampaigns();
  const selectedStatus = searchParams.status;
  
  const filteredCampaigns = selectedStatus 
    ? campaigns.filter(c => c.status === selectedStatus)
    : campaigns;

  const locale = 'ru-RU';
  const currencyOptions = { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 };
  const dateOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
  const today = new Date();

  return (
    <div>
      <PageHeader title="Кампании" description="Управляйте и отслеживайте все ваши маркетинговые кампании.">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <CampaignStatusFilter />
          <NewCampaignButton />
        </div>
      </PageHeader>
      
      <div className="grid gap-6">
        {filteredCampaigns.map((campaign) => {
          const startDate = new Date(campaign.startDate);
          const endDate = new Date(campaign.endDate);
          const totalDuration = Math.max(1, endDate.getTime() - startDate.getTime());
          const elapsedDuration = Math.max(0, today.getTime() - startDate.getTime());
          let durationProgress = Math.min(100, (elapsedDuration / totalDuration) * 100);

          return (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                     <CardTitle className="text-xl">
                        <Link href={`/campaigns/${campaign.id}`} className="hover:underline">
                            {campaign.name}
                        </Link>
                     </CardTitle>
                     <CardDescription className="mt-1">{campaign.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <EditCampaignButton campaign={campaign} asIcon={true} />
                    <DeleteCampaignButton campaignId={campaign.id} asIcon={true} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-md">
                            <Landmark className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-muted-foreground">Бюджет</p>
                            <p className="font-semibold">{new Intl.NumberFormat(locale, currencyOptions).format(campaign.budget)}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-md">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-muted-foreground">Длительность</p>
                            <p className="font-semibold">
                                {startDate.toLocaleDateString(locale, dateOptions)} - {endDate.toLocaleDateString(locale, dateOptions)}
                            </p>
                        </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Статус</p>
                      <UpdateCampaignStatus campaign={campaign} />
                    </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 pt-4 border-t">
                  <div className="flex justify-between w-full text-sm text-muted-foreground">
                      <span>Прогресс кампании</span>
                      <span>{Math.round(durationProgress)}%</span>
                  </div>
                  <Progress value={durationProgress} className="h-2 w-full" />
              </CardFooter>
            </Card>
          )
        })}
        
        {filteredCampaigns.length === 0 && (
            <Card>
                <CardContent className="text-center h-48 flex flex-col items-center justify-center text-muted-foreground">
                    <p>
                        {selectedStatus ? 'Нет кампаний, соответствующих вашим фильтрам.' : 'Кампании еще не созданы.'}
                    </p>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
