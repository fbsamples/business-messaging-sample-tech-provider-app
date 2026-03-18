// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { auth0 } from "@/lib/auth0";
import SidebarLayout from "@/app/components/SidebarLayout";
import LoggedOut from "@/app/components/LoggedOut";
import publicConfig from "@/app/public_config";
import { getAppDetails, getClientPhones } from "@/app/api/be_utils";
import InboxLayout from "@/app/components/InboxLayout";

export default async function Home() {
  // Fetch the user session
  const session = await auth0.getSession();

  // If no session, show the logged out component
  if (!session) {
    return <LoggedOut />;
  }

  const userId = session.user.email;

  const phones = await getClientPhones(userId);

  const appDetails = await getAppDetails(publicConfig.app_id);
  const app_name = appDetails.name;
  const logo_url = appDetails.logo_url;

  return (
    <SidebarLayout user_id={userId} logo_url={logo_url} app_name={app_name}>
      <InboxLayout phones={phones} />
    </SidebarLayout>
  );
}
