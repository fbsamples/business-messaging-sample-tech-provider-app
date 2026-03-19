// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import LiveWebhooks from "@/app/components/LiveWebhooks";
import SidebarLayout from "@/app/components/SidebarLayout";
import LoggedOut from "@/app/components/LoggedOut";
import publicConfig from "@/app/public_config";
import { getAppDetails } from "@/app/api/be_utils";
import { auth0 } from "@/lib/auth0";

const { app_id } = publicConfig;

export default async function Home() {
  // Fetch the user session
  const session = await auth0.getSession();

  // If no session, show the logged out component
  if (!session) {
    return <LoggedOut />;
  }

  const userId = session.user.email;
  const appDetails = await getAppDetails(app_id);
  const app_name = appDetails.name;
  const logo_url = appDetails.logo_url;

  return (
    <SidebarLayout user_id={userId} logo_url={logo_url} app_name={app_name}>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">My Webhooks</h1>
        <p className="text-sm text-gray-500 mt-1">Debug tool showing all your incoming webhooks.</p>
        <div className="mt-6">
          <LiveWebhooks />
        </div>
      </div>
    </SidebarLayout>
  );
}