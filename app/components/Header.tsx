// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import Image from 'next/image';
import Link from 'next/link';
import publicConfig from '@/app/publicConfig';
import { getAppDetails } from '@/app/api/beUtils';
import PrivacyPolicyModal from '@/app/components/PrivacyPolicyModal';

export default async function Header({ userId }: { userId: string }) {
  const appDetails = await getAppDetails(publicConfig.appId);
  const appName = appDetails.name;
  const logoUrl = appDetails.logo_url;

  return (
    <>
      <div className="border-solid border-black border-0 m-2 rounded-md flex justify-between">
        <div>
          <Link href="/" className="cursor-pointer">
            <Image className="relative" src={logoUrl} alt={appName} width={30} height={30} priority />
          </Link>
        </div>
        <div className="flex items-center">
          <div className="mr-4">
            <PrivacyPolicyModal appName={appName} contactEmail={publicConfig.contactEmail} />
          </div>
          <div className="rounded-lg px-4 py-1 mr-4 bg-gray-200">{userId}</div>
          <a
            href="/auth/logout"
            className="group rounded-lg border border-transparent px-4 py-1 transition-colors hover:border-gray-300 hover:bg-gray-100 text-base font-semibold"
          >
            Logout
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              {' ->'}
            </span>
          </a>
        </div>
      </div>
    </>
  );
}
