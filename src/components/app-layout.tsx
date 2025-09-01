"use client";

import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Header } from '@/components/header';
import { GlobalGanttChart } from './global-gantt-chart';
import { getCampaigns } from '@/lib/data';
import { useEffect, useState } from 'react';
import type { Campaign } from '@/lib/types';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const allCampaigns = await getCampaigns();
      setCampaigns(allCampaigns);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  return (
    <SidebarProvider>
        <div className="flex h-full">
            <AppSidebar />
            <ResizablePanelGroup direction="horizontal" className="w-full">
                <ResizablePanel defaultSize={30} minSize={20} maxSize={50} className="hidden lg:block">
                    <div className="h-full overflow-y-auto p-4">
                        <GlobalGanttChart campaigns={campaigns} isLoading={isLoading} />
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle className="hidden lg:flex" />
                <ResizablePanel defaultSize={70}>
                    <main className="flex flex-col h-full">
                        <Header />
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                            {children}
                        </div>
                    </main>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    </SidebarProvider>
  );
}
