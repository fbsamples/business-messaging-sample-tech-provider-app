// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { auth0 } from "@/lib/auth0";
import { getAdAccounts, getAppDetails } from "@/app/api/be_utils";
import LoggedOut from "@/app/components/LoggedOut";
import WabaPageLayout from "@/app/components/WabaPageLayout";
import AdAccountCard from "@/app/components/AdAccountCard";
import publicConfig from "@/app/public_config";

interface AdAccount {
  ad_account_id: string;
  name?: string;
  access_token: string;
  business_id: string;
}

export default async function MyAdAccounts() {
  const session = await auth0.getSession();

  if (!session) {
    return <LoggedOut />;
  }

  const userId = session.user.email;
  const appId = publicConfig.app_id;
  const appDetails = await getAppDetails(appId);
  const app_name = appDetails.name;
  const logo_url = appDetails.logo_url;

  const adAccounts = await getAdAccounts(userId);

  return (
    <WabaPageLayout
      title="My Ad Accounts"
      user_id={userId}
      logo_url={logo_url}
      app_name={app_name}
      isEmpty={adAccounts.length === 0}
      emptyMessage="No ad accounts found. Ad accounts will appear here once they are connected to your account."
    >
      {adAccounts.map((account: AdAccount) => (
        <AdAccountCard
          key={account.ad_account_id}
          ad_account_id={account.ad_account_id}
          name={account.name || "Unnamed Account"}
          access_token={account.access_token || ""}
          business_id={account.business_id || ""}
        />
      ))}
    </WabaPageLayout>
  );
}
