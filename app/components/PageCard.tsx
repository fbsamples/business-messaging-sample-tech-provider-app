// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
import { ExternalLink, FileText } from 'lucide-react';

interface PageCardProps {
  id: string;
  name: string;
  business_id: string;
}

export default function PageCard({ id, name }: PageCardProps) {
  const pageUrl = `https://www.facebook.com/${id}`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
          <FileText className="w-4.5 h-4.5 text-indigo-600" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 font-mono">ID: {id}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        <a
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1877F2] text-white text-xs font-medium rounded-lg hover:bg-[#1565C0] transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          View Page
        </a>
      </div>
    </div>
  );
}
