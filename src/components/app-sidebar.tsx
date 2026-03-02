
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calculator,
  LayoutGrid,
  ListChecks,
  Sparkles,
  Rocket,
  Megaphone,
  Network,
  HardDrive,
  Share2,
  ClipboardCheck,
} from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useSidebar } from './ui/sidebar';
import { ThemeSwitcher } from './theme-switcher';
import { Button } from './ui/button';

const menuGroups: { title?: string; items: { href: string; label: string; icon: typeof LayoutGrid }[] }[] = [
  { title: 'Обзор', items: [{ href: '/', label: 'Панель управления', icon: LayoutGrid }] },
  {
    title: 'Кампании и акции',
    items: [
      { href: '/campaigns', label: 'Кампании', icon: ListChecks },
      { href: '/actions', label: 'Акции', icon: Megaphone },
      { href: '/activities', label: 'Активности', icon: Network },
    ],
  },
  {
    title: 'Планирование',
    items: [
      { href: '/tasks', label: 'Задачи', icon: ClipboardCheck },
      { href: '/smm', label: 'SMM', icon: Share2 },
    ],
  },
  {
    title: 'Инструменты',
    items: [
      { href: '/creatives', label: 'Креативы', icon: Sparkles },
      { href: '/calculator', label: 'Калькулятор', icon: Calculator },
    ],
  },
  { items: [{ href: '/database', label: 'База данных', icon: HardDrive }] },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state, setOpen } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
         <Button variant="ghost" size="icon" className="group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8" onClick={() => setOpen(true)}>
            <Rocket className="h-5 w-5" />
         </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuGroups.map((group, groupIdx) => (
            <SidebarMenuItem key={group.title ?? groupIdx}>
              <div className={group.title ? "rounded-md bg-sidebar-accent/50 dark:bg-sidebar-accent/25 mb-2 px-1 py-1" : ""}>
                {group.title && (
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {group.title}
                  </p>
                )}
                <SidebarMenu className="space-y-0 gap-0">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')}
                        className="w-full"
                        tooltip={{ children: item.label, side: "right", align: "center" }}
                      >
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </div>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <ThemeSwitcher />
      </SidebarFooter>
    </Sidebar>
  );
}
