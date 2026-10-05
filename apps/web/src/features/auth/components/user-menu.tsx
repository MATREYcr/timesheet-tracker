'use client';

import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { authClient } from '@/lib/auth-client';
import { useSignOut } from '../hooks';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function UserMenu() {
  const t = useTranslations('account');
  const { data, isPending } = authClient.useSession();
  const { signOut, isPending: signingOut } = useSignOut();
  const user = data?.user;

  return (
    <SidebarMenu className="gap-1">
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          tooltip={user?.name}
          className="h-14 cursor-default gap-3 rounded-lg px-3 hover:bg-transparent active:bg-transparent"
        >
          <Avatar className="size-10 group-data-[collapsible=icon]:size-8">
            <AvatarFallback className="bg-primary-soft text-primary text-base font-semibold">
              {user ? initials(user.name) : ''}
            </AvatarFallback>
          </Avatar>
          {isPending || !user ? (
            <div className="grid flex-1 gap-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          ) : (
            <div className="grid flex-1 gap-0.5 text-left leading-tight">
              <span className="truncate text-[15px] font-semibold">
                {user.name}
              </span>
              <span className="text-muted-foreground truncate text-[13px]">
                {user.email}
              </span>
            </div>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={t('signOut')}
          onClick={signOut}
          disabled={signingOut}
          className="text-muted-foreground h-10 gap-3 rounded-lg px-3"
        >
          {signingOut ? <Spinner /> : <LogOut />}
          <span>{signingOut ? t('signingOut') : t('signOut')}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
