// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import LoggedOut from "@/app/components/LoggedOut";
import { getAdAccounts } from '@/app/api/be_utils';
import { auth0 } from "@/lib/auth0";
import AssetPage from '@/app/components/AssetPage';
import AssetCard from '@/app/components/AssetCard';

interface AdAccount {
  ad_account_id: string;
  name?: string;
  access_token: string;
  business_id: string;
}

export default async function MyAdAccounts() {
  // Fetch the user session
  const session = await auth0.getSession();

  // If no session, show the logged out component
  if (!session) {
    return <LoggedOut />;
  }

  const user_id = session.user.email;

  // Fetch ad account names from Facebook Graph API
  const adAccountsWithNames = await getAdAccounts(user_id);

  return (
    <AssetPage
      title="My Ad Accounts"
      user_id={user_id}
      isEmpty={adAccountsWithNames.length === 0}
      emptyMessage="No ad accounts found. Ad accounts will appear here once they are connected to your account."
    >
      {adAccountsWithNames.map((account: AdAccount) => (
        <AssetCard
          key={account.ad_account_id}
          id={account.ad_account_id}
          title={account.name || 'Unnamed Account'}
          access_token={account.access_token || ''}
          business_id={account.business_id}
          selected_asset_type="ad-account"
          path="ad_accounts"
          action_url={`https://adsmanager.facebook.com/adsmanager/manage/accounts?act=${account.ad_account_id}`}
          action_title="View in Ads Manager"
        />
      ))}
    </AssetPage>
  );
}