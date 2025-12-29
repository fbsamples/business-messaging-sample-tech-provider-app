// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


interface AssetCardProps {
    id: string;
    title: string;
    access_token: string;
    business_id: string;
    selected_asset_type: string;
    path: string;
    action_url: string;
    action_title: string;
}

export default function AssetCard({
    id,
    title,
    access_token,
    business_id,
    selected_asset_type,
    path,
    action_url,
    action_title
}: AssetCardProps) {
    const businessManagerUrl = `https://business.facebook.com/latest/settings/${path}?business_id=${business_id}&selected_asset_id=${id}&selected_asset_type=${selected_asset_type}`;

    return (
        <div key={id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">{title}</h2>
                    <div className="space-y-1">
                        <p className="text-sm text-gray-600">ID: {id}</p>
                        <p className="text-sm text-gray-600">Access Token: <a href={`https://developers.facebook.com/tools/debug/accesstoken/?access_token=${access_token}&version=v23.0`} target="_blank" rel="noopener noreferrer"><span className="font-mono bg-gray-100 px-2 py-1 rounded-sm text-xs">{access_token ? `${access_token.substring(0, 20)}...` : 'No token'}</span></a></p>
                    </div>
                </div>
                <div className="flex items-center">
                    <div className="ml-4">
                        <a
                            href={businessManagerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            View in Business Manager
                        </a>
                    </div>
                    <div className="ml-4">
                        <a
                            href={action_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            {action_title}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
