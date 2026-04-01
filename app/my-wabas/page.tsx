// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Building2 } from 'lucide-react';

import { auth0 } from '@/lib/auth0';
import { getWabas, getAppDetails } from '@/app/api/beUtils';
import type { WabaWithDetails } from '@/app/types/api';
import LoggedOut from '@/app/components/LoggedOut';
import WabaPageLayout from '@/app/components/WabaPageLayout';
import WabaCard from '@/app/components/WabaCard';
import publicConfig from '@/app/publicConfig';

export default async function MyWabas() {
  const session = await auth0.getSession();
  if (!session) return <LoggedOut />;

  const userId = session.user.email;
  const appDetails = await getAppDetails(publicConfig.appId);
  const wabas = await getWabas(userId);

  return (
    <WabaPageLayout
      title="My WABAs"
      description="WhatsApp Business Accounts connected to your app."
      userId={userId}
      logoUrl={appDetails.logo_url}
      appName={appDetails.name}
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
          businessId={waba.business_id || ''}
        />
      ))}
    </WabaPageLayout>
  );
}
