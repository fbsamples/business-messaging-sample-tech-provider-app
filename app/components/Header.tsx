// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import Image from "next/image";
import Link from "next/link";
import TpButtonInner from "@/app/components/Button";
import publicConfig from "@/app/public_config";
import { getAppDetails } from "@/app/api/be_utils";

export default async function Header({ user_id }) {

    const appId = publicConfig.app_id;
    const appDetails = await getAppDetails(appId);
    const app_name = appDetails.name;
    const logo_url = appDetails.logo_url;

    return (
        <>
            <div className="border-solid border-black border-0 m-2 rounded-md flex justify-between">
                <div>
                    <Link href='/' className="cursor-pointer">
                        <Image
                            className="relative"
                            src={logo_url}
                            alt={app_name}
                            width={30}
                            height={30}
                            priority
                        />
                    </Link>
                </div>
                <div className="flex items-center">
                    <div className="mr-4">
                        <a href="/privacy">Privacy Policy</a>
                    </div>
                    <div className="rounded-lg px-4 py-1 mr-4 bg-gray-200">
                        {user_id}
                    </div>
                    <TpButtonInner title="Logout" href="/auth/logout" />
                </div>
            </div>
        </>
    );
}
