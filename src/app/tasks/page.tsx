

import { PageHeader } from "@/components/page-header";
import { getAllTasks, getCampaigns } from "@/lib/data";
import { TaskList } from "./task-list";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddTaskButton } from "./add-task-button";
import type { TaskStatus } from "@/lib/types";

type TasksPageProps = {
    searchParams: {
        status?: string; // Comma-separated
        deadlineFrom?: string;
        deadlineTo?: string;
        campaignId?: string;
        actionId?: string;
        responsible?: string;
        view?: 'archived';
    }
}

function TasksLoadingSkeleton() {
  return (
    <div>
        <PageHeader title="Задачи" description="Управляйте всеми задачами в одном месте.">
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <Skeleton className="h-10 w-full md:w-40" />
                <Skeleton className="h-10 w-full md:w-40" />
            </div>
        </PageHeader>
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-8 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
  );
}

export default async function TasksPage({ searchParams: searchParamsProp }: TasksPageProps) {
  const searchParams = await searchParamsProp;
  const allTasks = await getAllTasks();
  const allCampaigns = await getCampaigns();
  
  const filteredTasks = allTasks.filter(task => {
    if (searchParams.view === 'archived') {
        if (!task.isArchived) return false;
    } else {
        if (task.isArchived) return false;
    }

    const statuses = searchParams.status ? searchParams.status.split(',') as TaskStatus[] : ['planned', 'in-progress'];
    if (statuses.length > 0 && !statuses.includes(task.status)) {
        return false;
    }
    
    if (searchParams.deadlineFrom && new Date(task.deadline) < new Date(searchParams.deadlineFrom)) return false;
    if (searchParams.deadlineTo && new Date(task.deadline) > new Date(searchParams.deadlineTo)) return false;
    if (searchParams.campaignId && task.campaignId !== searchParams.campaignId) return false;
    if (searchParams.actionId && task.actionId !== searchParams.actionId) return false;
    if (searchParams.responsible && task.responsiblePerson !== searchParams.responsible) return false;
    return true;
  });

  return (
    <div>
        <Suspense fallback={<TasksLoadingSkeleton />}>
            <TaskList initialTasks={filteredTasks} allCampaigns={allCampaigns} allTasks={allTasks} />
        </Suspense>
    </div>
  );
}
