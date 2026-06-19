'use client';

import { BarChart3, ChevronLeft, Clock, Users } from 'lucide-react';
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

const NAV_BUTTON =
  'h-9 gap-[11px] rounded-lg px-[11px] text-[13.5px] font-medium text-muted-foreground [&_svg]:!size-[18px] hover:bg-muted hover:text-foreground data-[active=true]:bg-primary-soft data-[active=true]:font-semibold data-[active=true]:text-primary';

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
      <SidebarHeader className="h-15 flex-row items-center gap-2.5 border-b px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <Link
          href="/"
          className="flex items-center gap-2.5 overflow-hidden font-bold tracking-tight"
        >
          <LightningLogo className="text-primary size-6 shrink-0" />
          <span className="text-[15px] whitespace-nowrap group-data-[collapsible=icon]:hidden">
            {t('app.title')}
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-2.5 py-3">
          <SidebarGroupContent>
            <SidebarMenu className="gap-[3px]">
              {NAV.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={t(item.key)}
                    className={NAV_BUTTON}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{t(item.key)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2.5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleSidebar}
              tooltip={t('sidebar.expand')}
              className="bg-primary-soft text-primary hover:bg-primary-soft border-primary-soft h-9 gap-[11px] rounded-lg border px-[11px] text-[13.5px] font-semibold hover:brightness-105 [&_svg]:!size-[17px]"
            >
              <ChevronLeft
                className={collapsed ? 'rotate-180 transition-transform' : 'transition-transform'}
              />
              <span>{t('sidebar.collapse')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
