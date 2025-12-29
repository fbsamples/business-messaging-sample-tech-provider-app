// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import LiveWebhooks from "@/app/components/LiveWebhooks";
import Header from "@/app/components/Header";
import LoggedOut from "@/app/components/LoggedOut";
import { auth0 } from "@/lib/auth0";

export default async function Home({ }) {
  // Fetch the user session
  const session = await auth0.getSession();

  // If no session, show the logged out component
  if (!session) {
    return <LoggedOut />;
  }

  const userId = session.user.email;


  return (
    <>
      <Header user_id={userId} />
      <main className="flex min-h-screen flex-col items-center justify-between p-6">
        <div>
          Listening for webhook events...
          <LiveWebhooks />
        </div>
      </main >
    </>
  );
}