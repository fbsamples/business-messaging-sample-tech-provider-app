// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { auth0 } from "@/lib/auth0";
import { getCatalogs, getAppDetails } from "@/app/api/be_utils";
import LoggedOut from "@/app/components/LoggedOut";
import WabaPageLayout from "@/app/components/WabaPageLayout";
import CatalogCard from "@/app/components/CatalogCard";
import publicConfig from "@/app/public_config";

interface Catalog {
  id: string;
  name?: string;
  access_token?: string;
  business_id?: string;
}

export default async function MyCatalogs() {
  const session = await auth0.getSession();

  if (!session) {
    return <LoggedOut />;
  }

  const userId = session.user.email;
  const appId = publicConfig.app_id;
  const appDetails = await getAppDetails(appId);
  const app_name = appDetails.name;
  const logo_url = appDetails.logo_url;

  const catalogs = await getCatalogs(userId);

  return (
    <WabaPageLayout
      title="My Catalogs"
      user_id={userId}
      logo_url={logo_url}
      app_name={app_name}
      isEmpty={catalogs.length === 0}
      emptyMessage="No catalogs found. Catalogs will appear here once they are connected to your account."
    >
      {catalogs.map((catalog: Catalog) => (
        <CatalogCard
          key={catalog.id}
          catalog_id={catalog.id}
          name={catalog.name || "Unnamed Catalog"}
          access_token={catalog.access_token || ""}
          business_id={catalog.business_id || ""}
        />
      ))}
    </WabaPageLayout>
  );
}
