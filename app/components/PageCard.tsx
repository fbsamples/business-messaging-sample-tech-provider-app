// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

interface PageCardProps {
  page_id: string;
  name: string;
  access_token: string;
  business_id: string;
  ad_campaign?: string;
}

export default function PageCard({
  page_id,
  name,
  access_token,
  business_id,
  ad_campaign,
}: PageCardProps) {
  const businessSettingsUrl = `https://business.facebook.com/latest/settings/pages?business_id=${business_id}&selected_asset_id=${page_id}&selected_asset_type=page`;
  const facebookPageUrl = `https://www.facebook.com/${page_id}`;
  const tokenDebugUrl = `https://developers.facebook.com/tools/debug/accesstoken/?access_token=${access_token}&version=v23.0`;

  const truncatedToken = access_token
    ? `${access_token.substring(0, 20)}...`
    : "No token";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 flex items-start justify-between">
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{name}</h3>
        <div className="space-y-1">
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <span className="font-medium">ID:</span>
            <svg className="w-4 h-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-700">{page_id}</span>
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Ad Campaign:</span>{" "}
            <span className="text-gray-700">{ad_campaign || "No Ad Campaign"}</span>
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Access Token:</span>{" "}
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
      </div>
      <div className="flex items-center gap-3">
        <a
          href={businessSettingsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-[#4599F7] text-white text-sm font-medium rounded hover:bg-[#3A8AE5] transition-colors"
        >
          View in Business Settings
        </a>
        <a
          href={facebookPageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-[#4599F7] text-white text-sm font-medium rounded hover:bg-[#3A8AE5] transition-colors"
        >
          View on Facebook
        </a>
      </div>
    </div>
  );
}
