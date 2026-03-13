// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { auth0 } from "@/lib/auth0";
import { getDatasets, getAppDetails } from "@/app/api/be_utils";
import LoggedOut from "@/app/components/LoggedOut";
import WabaPageLayout from "@/app/components/WabaPageLayout";
import DatasetCard from "@/app/components/DatasetCard";
import publicConfig from "@/app/public_config";

interface Dataset {
  id: string;
  name?: string;
  access_token?: string;
  business_id?: string;
}

export default async function MyDatasets() {
  const session = await auth0.getSession();

  if (!session) {
    return <LoggedOut />;
  }

  const userId = session.user.email;
  const appId = publicConfig.app_id;
  const appDetails = await getAppDetails(appId);
  const app_name = appDetails.name;
  const logo_url = appDetails.logo_url;

  const datasets = await getDatasets(userId);

  return (
    <WabaPageLayout
      title="My Datasets"
      user_id={userId}
      logo_url={logo_url}
      app_name={app_name}
      isEmpty={datasets.length === 0}
      emptyMessage="No datasets found. Datasets will appear here once they are connected to your account."
    >
      {datasets.map((dataset: Dataset) => (
        <DatasetCard
          key={dataset.id}
          dataset_id={dataset.id}
          name={dataset.name || "Unnamed Dataset"}
          access_token={dataset.access_token || ""}
          business_id={dataset.business_id || ""}
        />
      ))}
    </WabaPageLayout>
  );
}
