// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { auth0 } from '@/lib/auth0';
import SidebarLayout from '@/app/components/SidebarLayout';
import LoggedOut from '@/app/components/LoggedOut';
import publicConfig from '@/app/publicConfig';
import { getAppDetails } from '@/app/api/beUtils';
import LiveWebhooks from '@/app/components/LiveWebhooks';

export default async function MyWebhooks() {
  const session = await auth0.getSession();
  if (!session) return <LoggedOut />;

  const userId = session.user.email;
  const appDetails = await getAppDetails(publicConfig.appId);
  const appName = appDetails.name;
  const logoUrl = appDetails.logo_url;

  return (
    <SidebarLayout userId={userId} logoUrl={logoUrl} appName={appName}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">My Webhooks</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Real-time debug view of all incoming webhook events for your app.
          </p>
        </div>
        <LiveWebhooks />
      </div>
    </SidebarLayout>
  );
}
