// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Settings,
  Webhook,
  MessageSquare,
  Building2,
  FileText,
  Megaphone,
  Database,
  BookOpen,
  Instagram, Mail,
} from 'lucide-react';

import { cn } from '@/lib/utils';

interface SidebarLayoutProps {
  children: ReactNode;
  userId: string;
  logoUrl?: string;
  appName: string;
}

const navSections = [
  {
    title: 'Developer Tools',
    items: [
      {
        label: 'Configuration',
        description: 'Configure onboarding settings',
        href: '/',
        Icon: Settings,
      },
      {
        label: 'My Webhooks',
        description: 'Debug tool showing all your incoming webhooks',
        href: '/my-webhooks',
        Icon: Webhook,
      },
      {
        label: 'Send Paid Messages',
        description: 'Send paid template and Marketing Messages Lite via WhatsApp',
        href: '/paid_messaging',
        Icon: Mail,
      },
    ],
  },
  {
    title: 'Sample Products',
    items: [
      {
        label: 'My Inbox',
        description: 'Send and receive messages across all your phone numbers',
        href: '/my-inbox',
        Icon: MessageSquare,
      },
    ],
  },
  {
    title: 'My Assets',
    items: [
      { label: 'My WABAs', description: 'View all your WABAs', href: '/my-wabas', Icon: Building2 },
      { label: 'My Pages', description: 'View all your Facebook Pages', href: '/my-pages', Icon: FileText },
      {
        label: 'My Ad Accounts',
        description: 'View all your Facebook Ad Accounts',
        href: '/my-ad-accounts',
        Icon: Megaphone,
      },
      { label: 'My Datasets', description: 'View all your Facebook Datasets', href: '/my-datasets', Icon: Database },
      { label: 'My Catalogs', description: 'View all your Facebook Catalogs', href: '/my-catalogs', Icon: BookOpen },
      {
        label: 'My Instagram Accounts',
        description: 'View all your Instagram Accounts',
        href: '/my-instagram-accounts',
        Icon: Instagram,
      },
    ],
  },
];

export default function SidebarLayout({ children, userId, appName }: SidebarLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          {/* Inline SVG logo — chat bubble + centered lightning bolt */}
          <svg
            width="27"
            height="27"
            viewBox="0 0 256 256"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label={appName}
            className="flex-shrink-0"
          >
            <defs>
              <linearGradient id="logo-grad" x1="37" y1="37" x2="219" y2="219" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366F1" />
                <stop offset="1" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
            {/* Rounded-rect chat bubble */}
            <path
              d="M37 55C37 44.8 44.8 37 55 37H201C211.2 37 219 44.8 219 55V165C219 175.2 211.2 183 201 183H146L101 219V183H55C44.8 183 37 175.2 37 165V55Z"
              fill="url(#logo-grad)"
            />
            {/* Lightning bolt — centered */}
            <path d="M137 55L96 119H128L110 165L160 101H128L137 55Z" fill="white" />
          </svg>
          <span className="font-semibold text-slate-700 tracking-tight">{appName}</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="/privacy" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
            Privacy Policy
          </a>
          <span className="text-sm font-medium text-slate-600">{userId}</span>

          <a
            href="/auth/logout"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Logout
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </a>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-[#f0f2f5] border-r border-gray-200 flex flex-col flex-shrink-0">
          <nav className="flex-1 py-4 overflow-y-auto">
            {navSections.map((section) => (
              <div key={section.title} className="mb-4">
                <h3 className="px-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  {section.title}
                </h3>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-start gap-3 px-5 py-2 text-sm transition-colors',
                          isActive ? 'bg-[#e4e6ea]' : 'hover:bg-[#e4e6ea]',
                        )}
                      >
                        <span className={cn('mt-0.5 flex-shrink-0', isActive ? 'text-indigo-500' : 'text-slate-400')}>
                          <item.Icon className="w-4 h-4" />
                        </span>
                        <div>
                          <span className="text-[14px] font-semibold text-slate-700 block leading-snug">
                            {item.label}
                          </span>
                          {item.description && (
                            <p className="text-[12px] text-gray-400 mt-0.5 leading-snug">{item.description}</p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 min-h-0 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
