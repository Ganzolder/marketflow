
import { Suspense } from 'react';
import { ActionsList } from './actions-list';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

function ActionsLoadingSkeleton() {
  return (
    <div>
      <PageHeader title="Все акции" description="Просматривайте и управляйте всеми акциями в одном месте.">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Skeleton className="h-10 w-full md:w-56" />
          <Skeleton className="h-10 w-full md:w-56" />
          <Skeleton className="h-10 w-full md:w-56" />
        </div>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ActionsPage() {
  return (
    <Suspense fallback={<ActionsLoadingSkeleton />}>
      <ActionsList />
    </Suspense>
  );
}
