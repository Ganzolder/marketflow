
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

const menuItems = [
  { href: '/', label: 'Панель управления', icon: LayoutGrid },
  { href: '/campaigns', label: 'Кампании', icon: ListChecks },
  { href: '/actions', label: 'Акции', icon: Megaphone },
  { href: '/activities', label: 'Активности', icon: Network },
  { href: '/tasks', label: 'Задачи', icon: ClipboardCheck },
  { href: '/smm', label: 'SMM', icon: Share2 },
  { href: '/creatives', label: 'Креативы', icon: Sparkles },
  { href: '/calculator', label: 'Калькулятор', icon: Calculator },
  { href: '/database', label: 'База данных', icon: HardDrive },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 p-2 group-data-[collapsible=icon]:justify-center">
            <Rocket className="w-8 h-8 text-primary shrink-0" />
            <span className="text-xl font-semibold font-headline group-data-[collapsible=icon]:hidden">МаркетФлоу</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')}
                className="w-full"
                tooltip={{children: item.label, side:"right", align:"center"}}
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
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
