
import Link from 'next/link';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from '@/components/page-header';
import { getCampaigns } from '@/lib/data';
import { UpdateCampaignStatus } from './update-campaign-status';
import { Progress } from '@/components/ui/progress';
import { CampaignStatusFilter } from './campaign-status-filter';
import type { CampaignStatus } from '@/lib/types';
import { EditCampaignButton } from './edit-campaign-button';
import { DeleteCampaignButton } from './delete-campaign-button';
import { NewCampaignButton } from './new-campaign-button';

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
  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const today = new Date();

  return (
    <div>
      <PageHeader title="Кампании" description="Управляйте и отслеживайте все ваши маркетинговые кампании.">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <CampaignStatusFilter />
          <NewCampaignButton />
        </div>
      </PageHeader>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="hidden md:table-cell">Длительность</TableHead>
                <TableHead className="hidden lg:table-cell w-[150px]">Прогресс</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Бюджет</TableHead>
                <TableHead className="w-[100px] text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => {
                const startDate = new Date(campaign.startDate);
                const endDate = new Date(campaign.endDate);
                const totalDuration = Math.max(1, endDate.getTime() - startDate.getTime());
                const elapsedDuration = Math.max(0, today.getTime() - startDate.getTime());
                let durationProgress = Math.min(100, (elapsedDuration / totalDuration) * 100);

                return (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <Link href={`/campaigns/${campaign.id}`} className="font-medium hover:text-primary hover:underline">
                        {campaign.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <UpdateCampaignStatus campaign={campaign} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {startDate.toLocaleDateString(locale, {month: 'short', day: 'numeric'})} - {endDate.toLocaleDateString(locale, {month: 'short', day: 'numeric', year: 'numeric'})}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Progress value={durationProgress} />
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {new Intl.NumberFormat(locale, currencyOptions).format(campaign.budget)}
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                            <EditCampaignButton campaign={campaign} asIcon={true} />
                            <DeleteCampaignButton campaignId={campaign.id} asIcon={true} />
                        </div>
                    </TableCell>
                  </TableRow>
                )
              })}
               {filteredCampaigns.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        {selectedStatus ? 'Нет кампаний, соответствующих вашим фильтрам.' : 'Кампании еще не созданы.'}
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
