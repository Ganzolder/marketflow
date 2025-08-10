import { getCampaignById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Edit, PlusCircle, Calendar as CalendarIcon, DollarSign, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const campaign = await getCampaignById(params.id);

  if (!campaign) {
    notFound();
  }

  return (
    <div>
      <PageHeader title={campaign.name}>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </PageHeader>

      <div className="grid gap-8">
        <Card>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-muted-foreground">Budget</p>
                        <p className="font-semibold text-lg">${campaign.budget.toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md">
                        <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-muted-foreground">Duration</p>
                        <p className="font-semibold text-lg">{new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md">
                        <Target className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-muted-foreground">Status</p>
                        <div className="font-semibold text-lg"><StatusBadge status={campaign.status} /></div>
                    </div>
                </div>
            </div>
            <Separator className="my-6" />
            <p className="text-muted-foreground">{campaign.description}</p>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-bold font-headline mb-4">Campaign Goals</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campaign.goals.map(goal => (
              <Card key={goal.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{goal.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={(goal.current / goal.target) * 100} className="mb-2 h-3 bg-primary/20" indicatorClassName="bg-primary" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">{goal.current.toLocaleString()}</span> / {goal.target.toLocaleString()} {goal.unit}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold font-headline">Activities</h2>
            <Button variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Activity
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaign.activities.map(activity => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.name}</TableCell>
                      <TableCell>{activity.type}</TableCell>
                      <TableCell><StatusBadge status={activity.status} /></TableCell>
                      <TableCell>{new Date(activity.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(activity.endDate).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {campaign.activities.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                            No activities added yet.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
