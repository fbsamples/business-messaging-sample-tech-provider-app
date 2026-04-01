// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { auth0 } from '@/lib/auth0';
import SidebarLayout from '@/app/components/SidebarLayout';
import LoggedOut from '@/app/components/LoggedOut';
import publicConfig from '@/app/publicConfig';
import { getAppDetails, getClientPhones } from '@/app/api/beUtils';
import InboxLayout from '@/app/components/InboxLayout';

export default async function Home() {
  // Fetch the user session
  const session = await auth0.getSession();

  // If no session, show the logged out component
  if (!session) {
    return <LoggedOut />;
  }

  const userId = session.user.email;

  const phones = await getClientPhones(userId);

  const appDetails = await getAppDetails(publicConfig.appId);
  const appName = appDetails.name;
  const logoUrl = appDetails.logo_url;

  return (
    <SidebarLayout userId={userId} logoUrl={logoUrl} appName={appName}>
      <div className="h-full flex flex-col">
        <InboxLayout phones={phones} />
      </div>
    </SidebarLayout>
  );
}
