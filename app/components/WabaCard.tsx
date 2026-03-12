// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

interface WabaCardProps {
  id: string;
  name: string;
  access_token: string;
  business_id: string;
}

export default function WabaCard({
  id,
  name,
  access_token,
  business_id,
}: WabaCardProps) {
  const businessSettingsUrl = `https://business.facebook.com/latest/settings/whatsapp_account?business_id=${business_id}&selected_asset_id=${id}&selected_asset_type=whatsapp-business-account`;
  const whatsAppManagerUrl = `https://business.facebook.com/latest/whatsapp_manager/phone_numbers/?business_id=${business_id}&tab=phone-numbers&nav_ref=whatsapp_manager&asset_id=${id}`;
  const tokenDebugUrl = `https://developers.facebook.com/tools/debug/accesstoken/?access_token=${access_token}&version=v23.0`;

  const truncatedToken = access_token
    ? `${access_token.substring(0, 20)}...`
    : "No token";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-between">
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{name}</h3>
        {name !== "Unnamed WABA" && (
          <p className="text-sm text-gray-600 mb-1">
            ID: <span className="text-gray-700">{id}</span>
          </p>
        )}
        <p className="text-sm text-gray-600">
          Access Token:{" "}
          <a
            href={tokenDebugUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm text-gray-700 hover:text-blue-600 transition-colors"
          >
            {truncatedToken}
          </a>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <a
          href={businessSettingsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-[#1877F2] text-white text-sm font-medium rounded hover:bg-[#166FE5] transition-colors"
        >
          View in Business Settings
        </a>
        <a
          href={whatsAppManagerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-[#1877F2] text-white text-sm font-medium rounded hover:bg-[#166FE5] transition-colors"
        >
          View in WhatsApp Manager
        </a>
      </div>
    </div>
  );
}
