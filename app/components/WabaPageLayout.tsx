// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

"use client";

import { ReactNode } from "react";
import SidebarLayout from "@/app/components/SidebarLayout";

interface WabaPageLayoutProps {
  children: ReactNode;
  user_id: string;
  logo_url: string;
  app_name: string;
  title: string;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export default function WabaPageLayout({
  children,
  user_id,
  logo_url,
  app_name,
  title,
  isEmpty = false,
  emptyMessage = "No items found.",
}: WabaPageLayoutProps) {
  return (
    <SidebarLayout user_id={user_id} logo_url={logo_url} app_name={app_name}>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>
        {isEmpty ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">{children}</div>
        )}
      </div>
    </SidebarLayout>
  );
}
