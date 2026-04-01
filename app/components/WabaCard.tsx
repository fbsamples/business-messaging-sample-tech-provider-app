// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ExternalLink, Building2 } from 'lucide-react';

interface WabaCardProps {
  id: string;
  name: string;
  businessId: string;
}

export default function WabaCard({ id, name, businessId }: WabaCardProps) {
  const businessSettingsUrl = `https://business.facebook.com/latest/settings/whatsapp_account?business_id=${businessId}&selected_asset_id=${id}&selected_asset_type=whatsapp-business-account`;
  const whatsAppManagerUrl = `https://business.facebook.com/latest/whatsapp_manager/phone_numbers/?business_id=${businessId}&tab=phone-numbers&nav_ref=whatsapp_manager&asset_id=${id}`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-4.5 h-4.5 text-green-600" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{name}</h3>
          {name !== 'Unnamed WABA' && <p className="text-xs text-gray-500 mt-0.5 font-mono">ID: {id}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        <a
          href={businessSettingsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Business Settings
        </a>
        <a
          href={whatsAppManagerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1877F2] text-white text-xs font-medium rounded-lg hover:bg-[#1565C0] transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          WA Manager
        </a>
      </div>
    </div>
  );
}
