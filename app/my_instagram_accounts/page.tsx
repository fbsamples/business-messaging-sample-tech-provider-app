// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { auth0 } from "@/lib/auth0";
import { getInstagramAccounts, getAppDetails } from "@/app/api/be_utils";
import LoggedOut from "@/app/components/LoggedOut";
import WabaPageLayout from "@/app/components/WabaPageLayout";
import InstagramAccountCard from "@/app/components/InstagramAccountCard";
import publicConfig from "@/app/public_config";

interface InstagramAccount {
  id: string;
  username?: string;
  access_token?: string;
  business_id?: string;
}

export default async function MyInstagramAccounts() {
  const session = await auth0.getSession();

  if (!session) {
    return <LoggedOut />;
  }

  const userId = session.user.email;
  const appId = publicConfig.app_id;
  const appDetails = await getAppDetails(appId);
  const app_name = appDetails.name;
  const logo_url = appDetails.logo_url;

  const instagramAccounts = await getInstagramAccounts(userId);

  return (
    <WabaPageLayout
      title="My Instagram Accounts"
      user_id={userId}
      logo_url={logo_url}
      app_name={app_name}
      isEmpty={instagramAccounts.length === 0}
      emptyMessage="No Instagram accounts found. Instagram accounts will appear here once they are connected to your account."
    >
      {instagramAccounts.map((account: InstagramAccount) => (
        <InstagramAccountCard
          key={account.id}
          instagram_id={account.id}
          username={`@${account.username || "Unnamed Account"}`}
          access_token={account.access_token || ""}
          business_id={account.business_id || ""}
        />
      ))}
    </WabaPageLayout>
  );
}
