// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
import { auth0 } from '@/lib/auth0';
import { getAdAccounts, getAppDetails } from '@/app/api/beUtils';
import type { AdAccountWithDetails } from '@/app/types/api';
import LoggedOut from '@/app/components/LoggedOut';
import WabaPageLayout from '@/app/components/WabaPageLayout';
import AdAccountCard from '@/app/components/AdAccountCard';
import publicConfig from '@/app/publicConfig';
import { Megaphone } from 'lucide-react';

export default async function MyAdAccounts() {
  const session = await auth0.getSession();
  if (!session) return <LoggedOut />;

  const userId = session.user.email;
  const appDetails = await getAppDetails(publicConfig.app_id);
  const adAccounts = await getAdAccounts(userId);

  return (
    <WabaPageLayout
      title="My Ad Accounts"
      description="Facebook Ad Accounts connected to your app."
      user_id={userId}
      logo_url={appDetails.logo_url}
      app_name={appDetails.name}
      isEmpty={adAccounts.length === 0}
      emptyMessage="No ad accounts found."
      emptyDescription="Ad accounts will appear here once they are connected through the Embedded Signup flow."
      icon={<Megaphone className="w-10 h-10" />}
    >
      {adAccounts.map((account: AdAccountWithDetails) => (
        <AdAccountCard
          key={account.ad_account_id}
          ad_account_id={account.ad_account_id}
          name={account.name || 'Unnamed Account'}
          business_id={account.business_id || ''}
        />
      ))}
    </WabaPageLayout>
  );
}
