// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { auth0 } from "@/lib/auth0";
import LoggedOut from "@/app/components/LoggedOut";
import { getDatasets } from '@/app/api/be_utils';
import AssetPage from '@/app/components/AssetPage';
import AssetCard from '@/app/components/AssetCard';

interface Dataset {
    id: string;
    name?: string;
    code?: string;
    status?: string;
    last_fired_time?: string;
    access_token?: string;
    business_id?: string;
}

export default async function MyDatasets() {
    // Fetch the user session
    const session = await auth0.getSession();

    // If no session, show the logged out component
    if (!session) {
        return <LoggedOut />;
    }

    const user_id = session.user.email;

    // Fetch datasets from the API
    const datasets = await getDatasets(user_id);

    return (
        <AssetPage
            title="My Datasets"
            user_id={user_id}
            isEmpty={datasets.length === 0}
            emptyMessage="No datasets found. Datasets will appear here once they are connected to your account."
        >
            {datasets.map((dataset: Dataset) => (
                <AssetCard
                    key={dataset.id}
                    id={dataset.id}
                    title={dataset.name || 'Unnamed Dataset'}
                    access_token={dataset.access_token || ''}
                    business_id={dataset.business_id || ''}
                    selected_asset_type="events-dataset-new"
                    path="events_dataset_and_pixel"
                    action_url={`https://business.facebook.com/events_manager2/list/dataset/${dataset.id}/overview?business_id=${dataset.business_id}`}
                    action_title="View in Events Manager"
                />
            ))}
        </AssetPage>
    );
}
