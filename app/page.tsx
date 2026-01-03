// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import ClientDashboard from "@/app/components/ClientDashboard";
import Header from "@/app/components/Header";
import LoggedOut from "@/app/components/LoggedOut";
import publicConfig from "@/app/public_config";
import { getAppDetails } from "@/app/api/be_utils";
import { auth0 } from "@/lib/auth0";

const { app_id, business_id, public_es_feature_options, public_es_versions, public_es_feature_types, es_prefilled_setup } = publicConfig;

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
  const tp_configs = appDetails.config_ids;

  return (
    <div className="min-h-screen">
      <Header user_id={userId} />
      <div className="before:absolute before:h-[300px] before:w-full sm:before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full sm:after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-['']  lg:before:h-[360px] z-[-1]">
      </div>
      <div className="flex flex-col items-center justify-between">
        <ClientDashboard
          app_id={app_id}
          app_name={app_name}
          bm_id={business_id}
          user_id={userId}
          tp_configs={tp_configs}
          public_es_feature_options={public_es_feature_options}
          public_es_versions={public_es_versions}
          public_es_feature_types={public_es_feature_types}
          es_prefilled_setup={es_prefilled_setup}
        />
      </div>
    </div>
  );
}
