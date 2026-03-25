// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
import { ExternalLink, Key, Instagram } from "lucide-react";

interface InstagramAccountCardProps {
  id: string;
  name: string;
  access_token: string;
  business_id: string;
}

export default function InstagramAccountCard({ id, name, access_token, business_id: _business_id }: InstagramAccountCardProps) {
  const igUrl = `https://www.instagram.com/${name}/`;
  const tokenDebugUrl = `https://developers.facebook.com/tools/debug/accesstoken/?access_token=${access_token}&version=v23.0`;
  const truncatedToken = access_token ? `${access_token.substring(0, 20)}...` : "No token";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
          <Instagram className="w-4.5 h-4.5 text-pink-600" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 font-mono">ID: {id}</p>
          <div className="flex items-center gap-1 mt-1">
            <Key className="w-3 h-3 text-gray-400" />
            <a href={tokenDebugUrl} target="_blank" rel="noopener noreferrer"
               className="font-mono text-[11px] text-gray-500 hover:text-blue-600 transition-colors truncate max-w-[200px]">
              {truncatedToken}
            </a>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        <a href={igUrl} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-medium rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all">
          <ExternalLink className="w-3 h-3" />
          View Profile
        </a>
      </div>
    </div>
  );
}
