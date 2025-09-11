
import { Suspense } from 'react';
import { ActionsList } from './actions-list';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

function ActionsLoadingSkeleton() {
  return (
    <div>
      <PageHeader title="Все акции" description="Просматривайте и управляйте всеми акциями в одном месте.">
         <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-10 ml-auto" />
         </div>
      </PageHeader>
       <div className="mb-8 p-4 border rounded-lg bg-card shadow-sm flex flex-wrap items-end gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-64" />
          <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-10 w-10 ml-auto" />
      </div>
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
