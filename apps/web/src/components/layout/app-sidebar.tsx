'use client';

import { BarChart3, ChevronLeft, ChevronRight, Clock, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';

const NAV = [
  { href: '/employees', key: 'nav.employees', icon: Users },
  { href: '/time-entries', key: 'nav.timeEntries', icon: Clock },
  { href: '/weekly-summary', key: 'nav.weeklySummary', icon: BarChart3 },
] as const;

function LightningLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M13 2 4.5 13.5H11L9 22 18 9.5H11.5L13 2Z" />
    </svg>
  );
}

export function AppSidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/"
          className="flex items-center gap-2 px-2 py-1.5 font-bold tracking-tight"
        >
          <LightningLogo className="text-primary size-6 shrink-0" />
          <span className="text-base group-data-[collapsible=icon]:hidden">
            {t('app.title')}
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={t(item.key)}
                    className="data-[active=true]:bg-primary-soft data-[active=true]:text-primary h-10"
                  >
                    <Link href={item.href}>
                      <item.icon className="size-5" />
                      <span>{t(item.key)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleSidebar}
              tooltip={t('sidebar.expand')}
              className="text-muted-foreground h-10"
            >
              {collapsed ? (
                <ChevronRight className="size-5" />
              ) : (
                <ChevronLeft className="size-5" />
              )}
              <span>{t('sidebar.collapse')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
