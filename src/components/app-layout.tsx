
"use client";

import {
  SidebarProvider,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Header } from '@/components/header';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
        <div className="flex h-full">
            <AppSidebar />
            <main className="flex-1 overflow-y-auto">
                <Header />
                <div className="p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    </SidebarProvider>
  );
}
