// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
import type { ReactNode } from 'react';

import SidebarLayout from '@/app/components/SidebarLayout';

interface WabaPageLayoutProps {
  children: ReactNode;
  userId: string;
  logoUrl?: string;
  appName: string;
  title: string;
  description?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  icon?: React.ReactNode;
}

export default function WabaPageLayout({
  children,
  userId,
  logoUrl,
  appName,
  title,
  description,
  isEmpty = false,
  emptyMessage = 'No items found.',
  emptyDescription,
  icon,
}: WabaPageLayoutProps) {
  return (
    <SidebarLayout userId={userId} logoUrl={logoUrl} appName={appName}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {description && <p className="text-[13px] text-gray-500 mt-0.5">{description}</p>}
        </div>
        {isEmpty ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
            {icon && <div className="mb-3 flex justify-center text-gray-300">{icon}</div>}
            <p className="text-sm font-medium text-gray-600">{emptyMessage}</p>
            {emptyDescription && <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">{emptyDescription}</p>}
          </div>
        ) : (
          <div className="space-y-3">{children}</div>
        )}
      </div>
    </SidebarLayout>
  );
}
