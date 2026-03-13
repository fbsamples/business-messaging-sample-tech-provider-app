// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

interface DatasetCardProps {
  dataset_id: string;
  name: string;
  access_token: string;
  business_id: string;
}

export default function DatasetCard({
  dataset_id,
  name,
  access_token,
  business_id,
}: DatasetCardProps) {
  const businessSettingsUrl = `https://business.facebook.com/latest/settings/events_dataset_and_pixel?business_id=${business_id}&selected_asset_id=${dataset_id}&selected_asset_type=events-dataset-new`;
  const eventsManagerUrl = `https://business.facebook.com/events_manager2/list/dataset/${dataset_id}/overview?business_id=${business_id}`;
  const tokenDebugUrl = `https://developers.facebook.com/tools/debug/accesstoken/?access_token=${access_token}&version=v23.0`;

  const truncatedToken = access_token
    ? `${access_token.substring(0, 20)}...`
    : "No token";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 flex items-start justify-between">
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{name}</h3>
        <div className="space-y-1">
          <p className="text-sm text-gray-600">
            <span className="font-medium">ID:</span>{" "}
            <span className="text-gray-700">{dataset_id}</span>
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
          href={eventsManagerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-[#4599F7] text-white text-sm font-medium rounded hover:bg-[#3A8AE5] transition-colors"
        >
          View in Events Manager
        </a>
      </div>
    </div>
  );
}
