// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import LoggedOut from "@/app/components/LoggedOut";
import { getInstagramAccounts } from '@/app/api/be_utils';
import { auth0 } from "@/lib/auth0";
import AssetPage from '@/app/components/AssetPage';
import AssetCard from '@/app/components/AssetCard';

interface InstagramAccount {
    id: string;
    username?: string;
    name?: string;
    followers_count?: number;
    media_count?: number;
    account_type?: string;
    status?: string;
    connected_page_id?: string;
    access_token?: string;
    business_id?: string;
}

export default async function MyInstagramAccounts() {
    // Fetch the user session
    const session = await auth0.getSession();

    // If no session, show the logged out component
    if (!session) {
        return <LoggedOut />;
    }

    const user_id = session.user.email;


    // Fetch Instagram accounts from the API
    const instagramAccounts = await getInstagramAccounts(user_id);

    return (
        <AssetPage
            title="My Instagram Accounts"
            user_id={user_id}
            isEmpty={instagramAccounts.length === 0}
            emptyMessage="No Instagram accounts found. Instagram accounts will appear here once they are connected to your account."
        >
            {instagramAccounts.map((account: InstagramAccount) => (
                <AssetCard
                    key={account.id}
                    id={account.id}
                    title={`@${account.username || 'Unnamed Account'}`}
                    access_token={account.access_token || ''}
                    business_id={account.business_id || ''}
                    selected_asset_type="INSTAGRAM_ACCOUNT"
                    path="instagram_account"
                    action_url={`https://www.instagram.com/${account.username}`}
                    action_title="View on Instagram"
                />
            ))}
        </AssetPage>
    );
}
