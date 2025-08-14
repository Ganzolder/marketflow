
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { PlusCircle } from 'lucide-react';
import { UpdateCampaignStatus } from './update-campaign-status';

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();
  const locale = 'ru-RU';
  const currencyOptions = { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 };
  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

  return (
    <div>
      <PageHeader title="Кампании" description="Управляйте и отслеживайте все ваши маркетинговые кампании.">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Создать кампанию
        </Button>
      </PageHeader>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата начала</TableHead>
                <TableHead>Дата окончания</TableHead>
                <TableHead className="text-right">Бюджет</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <Link href={`/campaigns/${campaign.id}`} className="font-medium hover:text-primary hover:underline">
                      {campaign.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <UpdateCampaignStatus campaign={campaign} />
                  </TableCell>
                  <TableCell>
                    {new Date(campaign.startDate).toLocaleDateString(locale, dateOptions)}
                  </TableCell>
                  <TableCell>
                    {new Date(campaign.endDate).toLocaleDateString(locale, dateOptions)}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat(locale, currencyOptions).format(campaign.budget)}
                  </TableCell>
                </TableRow>
              ))}
               {campaigns.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                        Кампании еще не созданы.
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
