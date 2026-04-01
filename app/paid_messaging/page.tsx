// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { auth0 } from "@/lib/auth0";
import { getWabas, getAppDetails } from "@/app/api/beUtils";
import type { WabaClientData } from "@/app/types/api";
import LoggedOut from "@/app/components/LoggedOut";
import SidebarLayout from "@/app/components/SidebarLayout";
import PaidMessagingDashboard from "@/app/components/PaidMessagingDashboard";
import publicConfig from "@/app/publicConfig";
import { Mail } from "lucide-react";

export default async function PaidMessaging() {
    const session = await auth0.getSession();
    if (!session) return <LoggedOut />;

    const userId = session.user.email;
    const appDetails = await getAppDetails(publicConfig.app_id);
    const wabas = await getWabas(userId);

    // Strip access_token before passing to client component
    const wabaClientData: WabaClientData[] = wabas.map(waba => ({
        id: waba.id,
        name: waba.name,
        phone_numbers: waba.phone_numbers,
    }));

    return (
        <SidebarLayout user_id={userId} logo_url={appDetails.logo_url} app_name={appDetails.name}>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-gray-900">Send Template Message</h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                        Send paid template messages via WhatsApp Business API
                    </p>
                </div>
                {wabas.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
                        <div className="mb-3 flex justify-center text-gray-300">
                            <Mail className="w-10 h-10" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">No WABAs found.</p>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                            WABAs will appear here once they are connected through the Embedded Signup flow.
                        </p>
                    </div>
                ) : (
                    <PaidMessagingDashboard wabas={wabaClientData} />
                )}
            </div>
        </SidebarLayout>
    );
}
