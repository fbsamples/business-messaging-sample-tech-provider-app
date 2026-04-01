// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import ClientDashboard from "@/app/components/ClientDashboard";
import SidebarLayout from "@/app/components/SidebarLayout";
import LoggedOut from "@/app/components/LoggedOut";
import publicConfig from "@/app/publicConfig";
import { getAppDetails } from "@/app/api/beUtils";
import { auth0 } from "@/lib/auth0";

const { app_id, public_es_versions, public_es_feature_types, public_es_feature_options } = publicConfig;

export default async function Home() {
  // Fetch the user session
  const session = await auth0.getSession();

  // If no session, show the logged out component
  if (!session) {
    return <LoggedOut />;
  }

  const userId = session.user.email;
  const appDetails = await getAppDetails(app_id);
  const app_name = appDetails.name;
  const logo_url = appDetails.logo_url;
  const tp_configs = appDetails.config_ids;

  return (
    <SidebarLayout user_id={userId} logo_url={logo_url} app_name={app_name}>
      <ClientDashboard
        app_id={app_id}
        app_name={app_name}
        user_id={userId}
        tp_configs={tp_configs}
        public_es_versions={public_es_versions}
        public_es_feature_types={public_es_feature_types}
        public_es_feature_options={public_es_feature_options}
      />
    </SidebarLayout>
  );
}
