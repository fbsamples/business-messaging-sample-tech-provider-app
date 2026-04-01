// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
import { auth0 } from '@/lib/auth0';
import { getWabas, getAppDetails } from '@/app/api/beUtils';
import type { WabaWithDetails } from '@/app/types/api';
import LoggedOut from '@/app/components/LoggedOut';
import WabaPageLayout from '@/app/components/WabaPageLayout';
import WabaCard from '@/app/components/WabaCard';
import publicConfig from '@/app/publicConfig';
import { Building2 } from 'lucide-react';

export default async function MyWabas() {
  const session = await auth0.getSession();
  if (!session) return <LoggedOut />;

  const userId = session.user.email;
  const appDetails = await getAppDetails(publicConfig.app_id);
  const wabas = await getWabas(userId);

  return (
    <WabaPageLayout
      title="My WABAs"
      description="WhatsApp Business Accounts connected to your app."
      user_id={userId}
      logo_url={appDetails.logo_url}
      app_name={appDetails.name}
      isEmpty={wabas.length === 0}
      emptyMessage="No WABAs found."
      emptyDescription="WABAs will appear here once they are connected through the Embedded Signup flow."
      icon={<Building2 className="w-10 h-10" />}
    >
      {wabas.map((waba: WabaWithDetails, i: number) => (
        <WabaCard
          key={`${waba.id}-${i}`}
          id={waba.id}
          name={waba.name || 'Unnamed WABA'}
          business_id={waba.business_id || ''}
        />
      ))}
    </WabaPageLayout>
  );
}
