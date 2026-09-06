'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { markNotificationsRead } from '@/lib/proto/actions';

type Notif = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  createdAt: Date | string;
};

function ago(d: Date | string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationsBell({ items, unread }: { items: Notif[]; unread: number }) {
  const router = useRouter();

  async function onOpenChange(open: boolean) {
    if (open && unread > 0) {
      await markNotificationsRead();
      router.refresh();
    }
  }

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger className="relative grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
        <Bell className="size-4" />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-pop px-1 text-[10px] font-semibold leading-none text-pop-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-2.5 text-sm font-medium">Notifications</div>
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">You're all caught up.</p>
        ) : (
          <div className="max-h-96 divide-y divide-border overflow-y-auto">
            {items.map((nf) => {
              const content = (
                <div className={`flex gap-2.5 px-4 py-3 ${nf.read ? '' : 'bg-pop/5'}`}>
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${nf.read ? 'bg-transparent' : 'bg-pop'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">{nf.title}</p>
                    {nf.body ? <p className="mt-0.5 text-xs text-muted-foreground">{nf.body}</p> : null}
                    <p className="mt-1 text-[11px] text-muted-foreground">{ago(nf.createdAt)}</p>
                  </div>
                </div>
              );
              return nf.href ? (
                <Link key={nf.id} href={nf.href} className="block hover:bg-accent">
                  {content}
                </Link>
              ) : (
                <div key={nf.id}>{content}</div>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
