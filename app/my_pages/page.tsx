// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { auth0 } from "@/lib/auth0";
import { getPages, getAppDetails } from "@/app/api/be_utils";
import LoggedOut from "@/app/components/LoggedOut";
import WabaPageLayout from "@/app/components/WabaPageLayout";
import PageCard from "@/app/components/PageCard";
import publicConfig from "@/app/public_config";

interface Page {
  page_id: string;
  name?: string;
  access_token: string;
  ad_campaign?: string;
  business_id?: string;
}

export default async function MyPages() {
  const session = await auth0.getSession();

  if (!session) {
    return <LoggedOut />;
  }

  const userId = session.user.email;
  const appId = publicConfig.app_id;
  const appDetails = await getAppDetails(appId);
  const app_name = appDetails.name;
  const logo_url = appDetails.logo_url;

  const pages = await getPages(userId);

  return (
    <WabaPageLayout
      title="My Facebook Pages"
      user_id={userId}
      logo_url={logo_url}
      app_name={app_name}
      isEmpty={pages.length === 0}
      emptyMessage="No Facebook Pages found. Pages will appear here once they are connected to your account."
    >
      {pages.map((page: Page) => (
        <PageCard
          key={page.page_id}
          page_id={page.page_id}
          name={page.name || "Unnamed Page"}
          access_token={page.access_token || ""}
          business_id={page.business_id || ""}
          ad_campaign={page.ad_campaign}
        />
      ))}
    </WabaPageLayout>
  );
}
