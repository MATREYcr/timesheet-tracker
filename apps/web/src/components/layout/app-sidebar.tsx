'use client';

import {
  BarChart3,
  Clock,
  ClockArrowUp,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Link, usePathname } from '@/i18n/navigation';

const NAV = [
  { href: '/', key: 'dashboard', icon: LayoutDashboard },
  { href: '/employees', key: 'employees', icon: Users },
  { href: '/time-entries', key: 'timeEntries', icon: Clock },
  { href: '/weekly-summary', key: 'weeklySummary', icon: BarChart3 },
] as const;

const NAV_BUTTON =
  'h-11 gap-3 rounded-lg px-3 text-[15px] font-medium text-muted-foreground [&_svg]:size-5! hover:bg-muted hover:text-foreground data-[active=true]:bg-primary-soft data-[active=true]:font-semibold data-[active=true]:text-primary';

export function AppSidebar() {
  const tNav = useTranslations('nav');
  const tApp = useTranslations('app');
  const tAccount = useTranslations('account');
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [pathname, isMobile, setOpenMobile]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex-row items-center gap-2.5 border-b px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <Link
          href="/"
          className="flex items-center gap-2.5 overflow-hidden font-bold tracking-tight"
        >
          <ClockArrowUp className="text-primary size-6.5 shrink-0" />
          <span className="text-base whitespace-nowrap group-data-[collapsible=icon]:hidden">
            {tApp('title')}
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="p-4">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {NAV.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.href === '/'
                        ? pathname === '/'
                        : pathname.startsWith(item.href)
                    }
                    tooltip={tNav(item.key)}
                    className={NAV_BUTTON}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{tNav(item.key)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={tAccount('name')}
              className="h-14 cursor-default gap-3 rounded-lg px-3 hover:bg-transparent active:bg-transparent"
            >
              <Avatar className="size-10 group-data-[collapsible=icon]:size-8">
                <AvatarFallback className="bg-primary-soft text-primary text-base font-semibold">
                  A
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 gap-0.5 text-left leading-tight">
                <span className="truncate text-[15px] font-semibold">
                  {tAccount('name')}
                </span>
                <span className="text-muted-foreground truncate text-[13px]">
                  {tAccount('role')}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
