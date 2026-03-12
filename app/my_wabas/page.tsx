// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { auth0 } from "@/lib/auth0";
import { getWabas, getAppDetails } from "@/app/api/be_utils";
import LoggedOut from "@/app/components/LoggedOut";
import WabaPageLayout from "@/app/components/WabaPageLayout";
import WabaCard from "@/app/components/WabaCard";
import publicConfig from "@/app/public_config";
import type { WabaWithDetails } from "@/app/types/api";

export default async function MyWabas() {
  const session = await auth0.getSession();

  if (!session) {
    return <LoggedOut />;
  }

  const userId = session.user.email;
  const appId = publicConfig.app_id;
  const appDetails = await getAppDetails(appId);
  const app_name = appDetails.name;
  const logo_url = appDetails.logo_url;

  const wabas = await getWabas(userId);

  return (
    <WabaPageLayout
      title="My WhatsApp Business Accounts"
      user_id={userId}
      logo_url={logo_url}
      app_name={app_name}
      isEmpty={wabas.length === 0}
      emptyMessage="No WhatsApp Business Accounts found. WABAs will appear here once they are connected to your account."
    >
      {wabas.map((waba: WabaWithDetails) => (
        <WabaCard
          key={waba.id}
          id={waba.id}
          name={waba.name || "Unnamed WABA"}
          access_token={waba.access_token || ""}
          business_id={waba.business_id}
        />
      ))}
    </WabaPageLayout>
  );
}
