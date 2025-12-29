// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { auth0 } from "@/lib/auth0";
import Header from "@/app/components/Header";
import LoggedOut from "@/app/components/LoggedOut";
import { getClientPhones } from '@/app/api/be_utils';
import InboxLayout from '@/app/components/InboxLayout';

export default async function Home({ }) {
  // Fetch the user session
  const session = await auth0.getSession();

  // If no session, show the logged out component
  if (!session) {
    return <LoggedOut />;
  }

  const userId = session.user.email;

  const phones = await getClientPhones(userId);

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header user_id={userId} />
        <div className="flex-1 flex">
          <InboxLayout phones={phones} />
        </div>
      </div>
    </>
  );

}
