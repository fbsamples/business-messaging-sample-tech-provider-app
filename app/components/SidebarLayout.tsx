// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings, Webhook, MessageSquare, Building2, FileText,
  Megaphone, Database, BookOpen, Instagram,
} from "lucide-react";
import PrivacyPolicyModal from "./PrivacyPolicyModal";

interface SidebarLayoutProps {
  children: ReactNode;
  user_id: string;
  logo_url?: string;
  app_name: string;
}

const navSections = [
  {
    title: "Developer Tools",
    items: [
      {
        label: "Configuration",
        description: "Configure onboarding settings",
        href: "/",
        Icon: Settings,
      },
      {
        label: "My Webhooks",
        description: "Debug tool showing all your incoming webhooks",
        href: "/my_webhooks",
        Icon: Webhook,
      },
    ],
  },
  {
    title: "Sample Products",
    items: [
      {
        label: "My Inbox",
        description: "Send and receive messages across all your phone numbers",
        href: "/my_inbox",
        Icon: MessageSquare,
      },
    ],
  },
  {
    title: "My Assets",
    items: [
      { label: "My WABAs", description: "View all your WABAs", href: "/my_wabas", Icon: Building2 },
      { label: "My Pages", description: "View all your Facebook Pages", href: "/my_pages", Icon: FileText },
      { label: "My Ad Accounts", description: "View all your Facebook Ad Accounts", href: "/my_ad_accounts", Icon: Megaphone },
      { label: "My Datasets", description: "View all your Facebook Datasets", href: "/my_datasets", Icon: Database },
      { label: "My Catalogs", description: "View all your Facebook Catalogs", href: "/my_catalogs", Icon: BookOpen },
      { label: "My Instagram Accounts", description: "View all your Instagram Accounts", href: "/my_instagram_accounts", Icon: Instagram },
    ],
  },
];

export default function SidebarLayout({
  children,
  user_id,
  logo_url: _logo_url,
  app_name,
}: SidebarLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          {/* Chat bubble + lightning bolt logo — no background square */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
            {/* Chat bubble */}
            <path d="M4 6C4 4.895 4.895 4 6 4H22C23.105 4 24 4.895 24 6V18C24 19.105 23.105 20 22 20H16L11 24V20H6C4.895 20 4 19.105 4 18V6Z" fill="url(#logo-grad)" />
            {/* Lightning bolt */}
            <path d="M15.5 8L11 15H14.5L12.5 20L18 13H14.5L15.5 8Z" fill="white" />
            <defs>
              <linearGradient id="logo-grad" x1="4" y1="4" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366F1" />
                <stop offset="1" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
          </svg>
          <span className="font-semibold text-slate-700 tracking-tight">{app_name}</span>
        </div>
        <div className="flex items-center gap-6">
          <PrivacyPolicyModal app_name={app_name} />
          <span className="text-sm font-medium text-slate-600">{user_id}</span>
          <a
            href="/auth/logout"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Logout
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
                    const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-start gap-3 px-5 py-2 text-sm transition-colors ${
                          isActive ? "bg-[#e4e6ea]" : "hover:bg-[#e4e6ea]"
                        }`}
                      >
                        <span className={`mt-0.5 flex-shrink-0 ${isActive ? "text-indigo-500" : "text-slate-400"}`}>
                          <item.Icon className="w-4 h-4" />
                        </span>
                        <div>
                          <span className="text-[13px] font-semibold text-slate-700 block leading-snug">
                            {item.label}
                          </span>
                          {item.description && (
                            <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                              {item.description}
                            </p>
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
