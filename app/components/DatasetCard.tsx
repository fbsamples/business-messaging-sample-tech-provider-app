// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ExternalLink, Database } from 'lucide-react';

interface DatasetCardProps {
  id: string;
  name: string;
  businessId: string;
}

export default function DatasetCard({ id, name, businessId }: DatasetCardProps) {
  const eventsManagerUrl = `https://business.facebook.com/events_manager2/list/dataset/${id}?business_id=${businessId}`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
          <Database className="w-4.5 h-4.5 text-purple-600" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 font-mono">ID: {id}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        <a
          href={eventsManagerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1877F2] text-white text-xs font-medium rounded-lg hover:bg-[#1565C0] transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Events Manager
        </a>
      </div>
    </div>
  );
}
