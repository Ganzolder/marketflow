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
import { StatusBadge } from '@/components/status-badge';

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <div>
      <PageHeader title="Campaigns" description="Manage and track all your marketing campaigns.">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </PageHeader>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-right">Budget</TableHead>
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
                    <StatusBadge status={campaign.status} />
                  </TableCell>
                  <TableCell>
                    {new Date(campaign.startDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(campaign.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ${campaign.budget.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
