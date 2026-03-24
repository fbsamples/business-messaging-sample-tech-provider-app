// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
import { auth0 } from "@/lib/auth0";
import { getDatasets, getAppDetails } from "@/app/api/be_utils";
import { DatasetWithDetails } from "@/app/types/api";
import LoggedOut from "@/app/components/LoggedOut";
import WabaPageLayout from "@/app/components/WabaPageLayout";
import DatasetCard from "@/app/components/DatasetCard";
import publicConfig from "@/app/public_config";
import { Database } from "lucide-react";

export default async function MyDatasets() {
  const session = await auth0.getSession();
  if (!session) return <LoggedOut />;

  const userId = session.user.email;
  const appDetails = await getAppDetails(publicConfig.app_id);
  const datasets = await getDatasets(userId);

  return (
    <WabaPageLayout
      title="My Datasets"
      description="Facebook Datasets (Pixels) connected to your app."
      user_id={userId}
      logo_url={appDetails.logo_url}
      app_name={appDetails.name}
      isEmpty={datasets.length === 0}
      emptyMessage="No datasets found."
      emptyDescription="Datasets will appear here once they are connected through the Embedded Signup flow."
      icon={<Database className="w-10 h-10" />}
    >
      {datasets.map((dataset: DatasetWithDetails) => (
        <DatasetCard
          key={dataset.id}
          id={dataset.id}
          name={dataset.name || "Unnamed Dataset"}
          access_token={dataset.access_token || ""}
          business_id={dataset.business_id || ""}
        />
      ))}
    </WabaPageLayout>
  );
}
