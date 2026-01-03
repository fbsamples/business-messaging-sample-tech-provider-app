// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { auth0 } from "@/lib/auth0";
import { getWabas } from '@/app/api/be_utils';
import LoggedOut from "@/app/components/LoggedOut";
import AssetPage from '@/app/components/AssetPage';
import AssetCard from '@/app/components/AssetCard';
import type { WabaWithDetails } from '@/app/types/api';

export default async function MyWabas() {
  // Fetch the user session
  const session = await auth0.getSession();

  // If no session, show the logged out component
  if (!session) {
    return <LoggedOut />;
  }

  const userId = session.user.email;

  const wabas = await getWabas(userId);

  return (
    <AssetPage
      title="My WhatsApp Business Accounts"
      user_id={userId}
      isEmpty={wabas.length === 0}
      emptyMessage="No WhatsApp Business Accounts found. WABAs will appear here once they are connected to your account."
    >
      {wabas.map((waba: WabaWithDetails) => (
        <AssetCard
          key={waba.id}
          id={waba.id}
          title={waba.name || 'Unnamed WABA'}
          access_token={waba.access_token || ''}
          business_id={waba.business_id}
          selected_asset_type="whatsapp-business-account"
          path="whatsapp_account"
          action_url={`https://business.facebook.com/latest/whatsapp_manager/phone_numbers/?business_id=${waba.business_id}&tab=phone-numbers&nav_ref=whatsapp_manager&asset_id=${waba.id}`}
          action_title="View in WhatsApp Manager"
        />
      ))}
    </AssetPage>
  );
}
