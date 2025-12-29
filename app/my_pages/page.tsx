// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { auth0 } from "@/lib/auth0";
import Header from "@/app/components/Header";
import LoggedOut from "@/app/components/LoggedOut";
import { getPages } from '@/app/api/be_utils';

interface Page {
  page_id: string;
  name?: string;
  access_token: string;
  ad_campaign?: string;
  business_id?: string;
}

export default async function MyPages() {
  // Fetch the user session
  const session = await auth0.getSession();

  // If no session, show the logged out component
  if (!session) {
    return <LoggedOut />;
  }

  const user_id = session.user.email;


  // Fetch page names from Facebook Graph API
  const pagesWithNames = await getPages(user_id);

  return (
    <div className="min-h-screen">
      <Header user_id={user_id} />
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">My Facebook Pages</h1>
        <div className="space-y-4">
          {pagesWithNames.map((page: Page) => (
            <div key={page.page_id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">{page.name || 'Unnamed Page'}</h2>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">ID: {page.page_id}</p>
                    {page.ad_campaign && (
                      <p className="text-sm text-gray-600">Ad Campaign: {page.ad_campaign}</p>
                    )}
                    <p className="text-sm text-gray-600">Access Token: <a href={`https://developers.facebook.com/tools/debug/accesstoken/?access_token=${page.access_token}&version=v23.0`} target="_blank" rel="noopener noreferrer"><span className="font-mono bg-gray-100 px-2 py-1 rounded-sm text-xs">{page.access_token ? `${page.access_token.substring(0, 20)}...` : 'No token'}</span></a></p>
                  </div>
                </div>

                <div className="ml-4">
                  <a
                    href={`https://business.facebook.com/latest/settings/pages?business_id=${page.business_id}&selected_asset_id=${page.page_id}&selected_asset_type=page`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    View in Business Manager
                  </a>
                </div>

                <div className="ml-4">
                  <a
                    href={`https://www.facebook.com/${page.page_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    View on Facebook
                  </a>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}