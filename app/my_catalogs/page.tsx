// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { auth0 } from "@/lib/auth0";
import LoggedOut from "@/app/components/LoggedOut";
import { getCatalogs } from '@/app/api/be_utils';
import AssetPage from '@/app/components/AssetPage';
import AssetCard from '@/app/components/AssetCard';

interface Catalog {
    id: string;
    name?: string;
    vertical?: string;
    item_count?: number;
    last_updated?: string;
    status?: string;
    access_token?: string;
    business_id?: string;
}

export default async function MyCatalogs() {
    // Fetch the user session
    const session = await auth0.getSession();

    // If no session, show the logged out component
    if (!session) {
        return <LoggedOut />;
    }

    const user_id = session.user.email;

    // Fetch catalogs from the API
    const catalogs = await getCatalogs(user_id);

    return (
        <AssetPage
            title="My Facebook Catalogs"
            user_id={user_id}
            isEmpty={catalogs.length === 0}
            emptyMessage="No catalogs found. Catalogs will appear here once they are connected to your account."
        >
            {catalogs.map((catalog: Catalog) => (
                <AssetCard
                    key={catalog.id}
                    id={catalog.id}
                    title={catalog.name || 'Unnamed Catalog'}
                    access_token={catalog.access_token || ''}
                    business_id={catalog.business_id || ''}
                    selected_asset_type="product-catalog"
                    path="product_catalogs"
                    action_url={`https://business.facebook.com/commerce/catalogs/${catalog.id}/products?business_id=${catalog.business_id}`}
                    action_title="View in Commerce Manager"
                />
            ))}
        </AssetPage>
    );
}
