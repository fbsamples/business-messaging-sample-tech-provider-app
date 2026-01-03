// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


'use server';

import getPrivateConfig from "../private_config";
import publicConfig from "../public_config";
import { sql } from '@vercel/postgres';
import type {
    SubscribeWebhookResponse,
    SqlResult,
    WabaDetails,
    WabaRow,
    WabaWithDetails,
    PhoneNumber,
    PhoneDetails,
    ClientPhone,
    RegisterNumberResponse,
    DeregisterNumberResponse,
    RequestCodeResponse,
    VerifyCodeResponse,
    SendMessageResponse,
    PageRow,
    PageWithDetails,
    AdAccountRow,
    AdAccountWithDetails,
    DatasetRow,
    DatasetWithDetails,
    CatalogRow,
    CatalogWithDetails,
    InstagramAccountRow,
    InstagramAccountWithDetails,
    AppDetails,
    SubscribedAppsResponse,
    AssignedUsersResponse
} from '../types/api';

const { graph_api_version, redirect_uri } = publicConfig;

export async function getToken(code: string, app_id: string): Promise<string> {
    const privateConfig = await getPrivateConfig();
    const { fb_app_secret: app_secret } = privateConfig;
    console.log('getToken:', 'code', code, 'app_id', app_id);
    const url = `/oauth/access_token?client_id=${app_id}&redirect_uri=${redirect_uri}&client_secret=${app_secret}&code=${code}`;
    return graphApiWrapperGet(url)
        .then(data => {
            console.log('getTokenResponse:', 'code', code, 'app_id', app_id, 'data', data);
            if (data.error) throw data.error;
            return data.access_token;
        });
}

export async function subscribeWebhook(access_token: string, waba_id: string): Promise<SubscribeWebhookResponse> {
    console.log('subscribeWebhook:', 'access_token', access_token, 'waba_id', waba_id);
    const url = `/${waba_id}/subscribed_apps`;
    return graphApiWrapperPost(url, access_token)
        .then(data => {
            console.log('subscribeWebhookResponse:', 'waba_id', waba_id, 'data', data);
            if (data.error) throw data.error;
            return data;
        });
}

export async function saveWabaToken(access_token: string, waba_id: string, app_id: string, user_id: string, business_id: string): Promise<SqlResult> {
    console.log('saveWabaToken:', 'access_token', access_token, 'waba_id', waba_id, 'app_id', app_id, 'business_id', business_id);

    return await sql`
        INSERT INTO wabas (user_id, app_id, waba_id, access_token, business_id, last_updated)
        VALUES (${user_id}, ${app_id}, ${waba_id}, ${access_token}, ${business_id}, current_timestamp)
        ON CONFLICT (user_id, app_id, waba_id)
        DO UPDATE SET access_token = EXCLUDED.access_token, business_id = EXCLUDED.business_id, last_updated=current_timestamp
    `;
}

export async function savePageToken(access_token: string, page_id: string, app_id: string, user_id: string, business_id: string): Promise<SqlResult> {
    console.log('savePageToken:', 'access_token', access_token, 'page_id', page_id, 'app_id', app_id, 'business_id', business_id);

    return await sql`
        INSERT INTO pages (user_id, app_id, page_id, access_token, business_id, last_updated)
        VALUES (${user_id}, ${app_id}, ${page_id}, ${access_token}, ${business_id}, current_timestamp)
        ON CONFLICT (user_id, app_id, page_id)
        DO UPDATE SET access_token = EXCLUDED.access_token, business_id = EXCLUDED.business_id, last_updated=current_timestamp
    `;
}

export async function saveAdAccountToken(access_token: string, ad_account_id: string, app_id: string, user_id: string, business_id: string): Promise<SqlResult> {
    console.log('saveAdAccountToken:', 'access_token', access_token, 'ad_account_id', ad_account_id, 'app_id', app_id, 'business_id', business_id);

    return await sql`
        INSERT INTO ad_accounts (user_id, app_id, ad_account_id, access_token, business_id, last_updated)
        VALUES (${user_id}, ${app_id}, ${ad_account_id}, ${access_token}, ${business_id}, current_timestamp)
        ON CONFLICT (user_id, app_id, ad_account_id)
        DO UPDATE SET access_token = EXCLUDED.access_token, business_id = EXCLUDED.business_id, last_updated=current_timestamp
    `;
}

export async function saveDatasetToken(access_token: string, dataset_id: string, app_id: string, user_id: string, business_id: string): Promise<SqlResult> {
    console.log('saveDatasetToken:', 'access_token', access_token, 'dataset_id', dataset_id, 'app_id', app_id, 'business_id', business_id);

    return await sql`
        INSERT INTO datasets (user_id, app_id, dataset_id, access_token, business_id, last_updated)
        VALUES (${user_id}, ${app_id}, ${dataset_id}, ${access_token}, ${business_id}, current_timestamp)
        ON CONFLICT (user_id, app_id, dataset_id)
        DO UPDATE SET access_token = EXCLUDED.access_token, business_id = EXCLUDED.business_id, last_updated=current_timestamp
    `;
}

export async function saveCatalogToken(access_token: string, catalog_id: string, app_id: string, user_id: string, business_id: string): Promise<SqlResult> {
    console.log('saveCatalogToken:', 'access_token', access_token, 'catalog_id', catalog_id, 'app_id', app_id, 'business_id', business_id);

    return await sql`
        INSERT INTO catalogs (user_id, app_id, catalog_id, access_token, business_id, last_updated)
        VALUES (${user_id}, ${app_id}, ${catalog_id}, ${access_token}, ${business_id}, current_timestamp)
        ON CONFLICT (user_id, app_id, catalog_id)
        DO UPDATE SET access_token = EXCLUDED.access_token, business_id = EXCLUDED.business_id, last_updated=current_timestamp
    `;
}

export async function saveInstagramAccountToken(access_token: string, instagram_account_id: string, app_id: string, user_id: string, business_id: string): Promise<SqlResult> {
    console.log('saveInstagramAccountToken:', 'access_token', access_token, 'instagram_account_id', instagram_account_id, 'app_id', app_id, 'business_id', business_id);

    return await sql`
        INSERT INTO instagram_accounts (user_id, app_id, instagram_account_id, access_token, business_id, last_updated)
        VALUES (${user_id}, ${app_id}, ${instagram_account_id}, ${access_token}, ${business_id}, current_timestamp)
        ON CONFLICT (user_id, app_id, instagram_account_id)
        DO UPDATE SET access_token = EXCLUDED.access_token, business_id = EXCLUDED.business_id, last_updated=current_timestamp
    `;
}

export async function saveBusinessToken(access_token: string, business_id: string, app_id: string, user_id: string): Promise<SqlResult> {
    console.log('saveBusinessToken:', 'access_token', access_token, 'business_id', business_id, 'app_id', app_id);

    return await sql`
        INSERT INTO businesses (user_id, app_id, business_id, access_token, last_updated)
        VALUES (${user_id}, ${app_id}, ${business_id}, ${access_token}, current_timestamp)
        ON CONFLICT (user_id, app_id, business_id)
        DO UPDATE SET access_token = EXCLUDED.access_token, last_updated=current_timestamp
    `;
}

export async function saveTokens(user_id: string, app_id: string, business_id: string, page_ids: string[], ad_account_ids: string[], waba_ids: string[], dataset_ids: string[], catalog_ids: string[], instagram_account_ids: string[], access_token: string): Promise<SqlResult[]> {
    const promises: Promise<SqlResult>[] = [];
    promises.push(saveBusinessToken(access_token, business_id, app_id, user_id));
    page_ids.forEach(page_id => {
        promises.push(savePageToken(access_token, page_id, app_id, user_id, business_id));
    });
    ad_account_ids.forEach(ad_account_id => {
        promises.push(saveAdAccountToken(access_token, ad_account_id, app_id, user_id, business_id));
    });
    waba_ids.forEach(waba_id => {
        promises.push(saveWabaToken(access_token, waba_id, app_id, user_id, business_id));
    });
    dataset_ids.forEach(dataset_id => {
        promises.push(saveDatasetToken(access_token, dataset_id, app_id, user_id, business_id));
    });
    catalog_ids.forEach(catalog_id => {
        promises.push(saveCatalogToken(access_token, catalog_id, app_id, user_id, business_id));
    });
    instagram_account_ids.forEach(instagram_account_id => {
        promises.push(saveInstagramAccountToken(access_token, instagram_account_id, app_id, user_id, business_id));
    });
    return Promise.all(promises);
}

export async function registerNumber(phoneId: string, accessToken: string): Promise<RegisterNumberResponse> {
    const privateConfig = await getPrivateConfig();
    const { fb_reg_pin } = privateConfig;
    console.log('registerNumber:', 'phoneId', phoneId, 'accessToken', accessToken);
    const url = `/${phoneId}/register`;
    return graphApiWrapperPost(url, accessToken, {
        "messaging_product": "whatsapp",
        "pin": fb_reg_pin
    })
        .then(data => {
            console.log('registerNumberReponse:', data);
            if (data.error) throw data.error;
            return data;
        })
}

export async function deregisterNumber(phoneId: string, accessToken: string): Promise<DeregisterNumberResponse> {
    console.log('deregisterNumber:', 'phoneId', phoneId, 'accessToken', accessToken);
    const url = `/${phoneId}/deregister`;
    return graphApiWrapperPost(url, accessToken)
        .then(data => {
            console.log('deregisterNumberReponse:', data);
            if (data.error) throw data.error;
            return data;
        })
}

export async function send(phone_number_id: string, accessToken: string, dest_phone: string, message_content: string): Promise<SendMessageResponse | void> {
    console.log('send', 'phone_number_id', phone_number_id, 'accessToken', accessToken, 'dest_phone', dest_phone, 'message_content', message_content);
    const url = `/${phone_number_id}/messages`;
    return graphApiWrapperPost(url, accessToken, {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": dest_phone,
        "type": "text",
        "text": { // the text object
            "preview_url": false,
            "body": message_content
        }
    })
        .then(data => console.log('sendResponse', JSON.stringify(data, null, 2)))
        .catch(err => console.error(err));
}

//////////////////////////////////////////////////////////
// WABA Details \/
//////////////////////////////////////////////////////////

export async function getWabas(user_id: string): Promise<WabaWithDetails[]> {
    // Get page IDs and access tokens from the database
    const { rows }: { rows: WabaRow[] } = await sql`
    SELECT DISTINCT waba_id, access_token, business_id
    FROM wabas
    WHERE user_id = ${user_id}
    ORDER BY waba_id ASC
  `;

    // Fetch page names from Facebook Graph API
    const wholeWabas: WabaWithDetails[] = await Promise.all(
        rows.map(async (waba: WabaRow) => {
            try {
                const wholeWaba: WabaDetails = await getWabaDetails(waba.waba_id, waba.access_token);
                return {
                    ...wholeWaba,
                    business_id: waba.business_id,
                    access_token: waba.access_token
                } as WabaWithDetails;
            } catch (error) {
                console.error(`Error fetching name for page ${waba.waba_id}:`, error);
                return {
                    id: waba.waba_id,
                    name: 'Error Loading Name',
                    account_review_status: 'unknown',
                    ownership_type: 'unknown',
                    subscribed_apps: { data: [] },
                    business_verification_status: 'unknown',
                    country: 'unknown',
                    currency: 'unknown',
                    timezone_id: 'unknown',
                    is_enabled_for_insights: false,
                    phone_numbers: { data: [] },
                    business_id: waba.business_id,
                    access_token: waba.access_token
                } as WabaWithDetails;
            }
        })
    );
    return wholeWabas;
}

export async function getWabaDetails(wabaId: string, accessToken: string): Promise<WabaDetails> {
    console.log('getWabaDetails', 'wabaId', wabaId, 'accessToken', accessToken);
    const url = `/${wabaId}?fields=account_review_status,purchase_order_number,audiences,name,ownership_type,subscribed_apps,business_verification_status,country,currency,timezone_id,on_behalf_of_business_info,schedules,is_enabled_for_insights,message_templates,phone_numbers`;
    return graphApiWrapperGet(url, accessToken)
        .then(data => {
            console.log('getWabaDetailsResponse', 'wabaId', wabaId, 'accessToken', accessToken, 'data', data);
            return data;
        })
};

export async function getSubscribedApps(wabaId: string, accessToken: string): Promise<SubscribedAppsResponse> {
    console.log('getSubscribedApps', 'wabaId', wabaId, 'access_token', accessToken);
    const url = `/${wabaId}/subscribed_apps`;
    return graphApiWrapperGet(url, accessToken)
        .then(data => {
            console.log('getSubscribedAppsResponse', 'wabaId', wabaId, 'access_token', accessToken, 'data', JSON.stringify(data, null, 2));
            return data;
        });
};

export async function getAssignedUsers(wabaId: string, businessId: string, accessToken: string): Promise<AssignedUsersResponse> {
    console.log('getAssignedUsers', 'wabaId', wabaId, 'accessToken', accessToken);
    const url = `/${wabaId}/assigned_users?business=${businessId}`;
    return graphApiWrapperGet(url, accessToken)
        .then(data => {
            console.log('getAssignedUsersResponse', 'wabaId', wabaId, 'accessToken', accessToken, 'data', JSON.stringify(data, null, 2));
            return data;
        });
};

export async function getClientWabaIds(user_id: string): Promise<WabaRow[]> {
    const { rows }: { rows: WabaRow[] } = await sql`SELECT DISTINCT ON (waba_id) access_token, waba_id, business_id FROM wabas WHERE user_id = ${user_id}`;
    return rows;
}

export async function getClientWabas(user_id: string): Promise<WabaWithDetails[]> {
    const rows: WabaRow[] = await getClientWabaIds(user_id);
    const wabas: WabaWithDetails[] = await Promise.all(rows.map(async (row: WabaRow, _key: number) => {
        const waba_id: string = row.waba_id;
        const access_token: string = row.access_token;
        const business_id: string = row.business_id;
        const wholeWaba: WabaDetails = await getWabaDetails(waba_id, access_token);
        return {
            ...wholeWaba,
            business_id: business_id,
            access_token: access_token
        };
    }));

    return wabas;
}

//////////////////////////////////////////////////////////
// Phones
//////////////////////////////////////////////////////////

export async function getClientPhones(userId: string): Promise<ClientPhone[]> {
    const rows: WabaRow[] = await getClientWabaIds(userId);
    const nested_phones: PhoneDetails[][] = await Promise.all(rows.map(async (row: WabaRow, _key: number) => {
        const wabaId: string = row.waba_id;
        const accessToken: string = row.access_token;
        const data = await graphApiWrapperGet(`/${wabaId}?fields=phone_numbers`, accessToken);
        const phones: PhoneNumber[] = data?.phone_numbers?.data || [];
        const phone_deets: PhoneDetails[] = await Promise.all(phones.map(async (phone: PhoneNumber, _key: number) => {
            return await getPhoneDetails(phone.id, accessToken, wabaId);
        }));
        return phone_deets;
    }));
    // console.log('deets');
    // console.log(JSON.stringify(nested_phones, null, 2));
    return nested_phones.flat() as ClientPhone[];
};

export async function getPhoneDetails(phoneId: string, accessToken: string, wabaId: string): Promise<PhoneDetails> {
    return graphApiWrapperGet(`/${phoneId}?fields=status,account_mode,certificate,is_on_biz_app,display_phone_number,code_verification_status`, accessToken)
        .then(async data => {
            data.wabaId = wabaId;
            const isAckBotEnabled = await getAckBotStatus(phoneId);
            data.isAckBotEnabled = isAckBotEnabled;
            return data;
        });
};

export async function getTokenForWaba(waba_id: string): Promise<string> {
    console.log('getTokenForWaba:', 'waba_id', waba_id);
    const { rows }: { rows: { access_token: string }[] } = await sql`SELECT access_token FROM wabas WHERE waba_id = ${waba_id}`;
    return rows[0].access_token;
}

//////////////////////////////////////////////////////////
// Verification Request \/
//////////////////////////////////////////////////////////

export async function requestCode(phoneId: string, accessToken: string): Promise<RequestCodeResponse> {
    console.log('requestCode:', 'phoneId', phoneId, 'accessToken', accessToken);
    const url = `/${phoneId}/request_code?code_method=SMS&language=en`;
    return graphApiWrapperPost(url, accessToken);
}

export async function verifyCode(phoneId: string, accessToken: string, otpCode: string): Promise<VerifyCodeResponse> {
    console.log('verifyCode:', 'phoneId', phoneId, 'accessToken', accessToken);
    const url = `/${phoneId}/verify_code?code=${otpCode}`;
    return graphApiWrapperPost(url, accessToken);
}

//////////////////////////////////////////////////////////
// Pages
//////////////////////////////////////////////////////////

export async function getPages(user_id: string): Promise<PageWithDetails[]> {
    // Get page IDs and access tokens from the database
    const { rows }: { rows: PageRow[] } = await sql`
    SELECT DISTINCT page_id, access_token, business_id
    FROM pages
    WHERE user_id = ${user_id}
    ORDER BY page_id ASC
  `;

    // Fetch page names from Facebook Graph API
    const pagesWithNames: PageWithDetails[] = await Promise.all(
        rows.map(async (page: PageRow) => {
            try {
                const response = await fetch(
                    `https://graph.facebook.com/${graph_api_version}/${page.page_id}?fields=name,ad_campaign&access_token=${page.access_token}`
                );
                const data = await response.json();
                console.log('page!*!', data);
                return {
                    ...page,
                    name: data.name || 'Unknown Page',
                    ad_campaign: data.ad_campaign || 'No Ad Campaign'
                } as PageWithDetails;
            } catch (error) {
                console.error(`Error fetching name for page ${page.page_id}:`, error);
                return {
                    ...page,
                    name: 'Error Loading Name',
                    ad_campaign: 'No Ad Campaign'
                } as PageWithDetails;
            }
        })
    );
    return pagesWithNames;
}


//////////////////////////////////////////////////////////
// Ad accounts
//////////////////////////////////////////////////////////

export async function getAdAccounts(user_id: string): Promise<AdAccountWithDetails[]> {
    // Get ad account IDs and access tokens from the database
    const { rows }: { rows: AdAccountRow[] } = await sql`
    SELECT DISTINCT ad_account_id, access_token, business_id
    FROM ad_accounts
    WHERE user_id = ${user_id}
    ORDER BY ad_account_id ASC
  `;

    // Fetch ad account names from Facebook Graph API
    const adAccountsWithNames: AdAccountWithDetails[] = await Promise.all(
        rows.map(async (account: AdAccountRow) => {
            try {
                const response = await fetch(
                    `https://graph.facebook.com/${graph_api_version}/act_${account.ad_account_id}?fields=name&access_token=${account.access_token}`
                );
                const data = await response.json();
                return {
                    ...account,
                    name: data.name || 'Unknown Account'
                };
            } catch (error) {
                console.error(`Error fetching name for ad account ${account.ad_account_id}:`, error);
                return {
                    ...account,
                    name: 'Error Loading Name'
                };
            }
        })
    );
    return adAccountsWithNames;
}


//////////////////////////////////////////////////////////
// Reqeust Wrappers
//////////////////////////////////////////////////////////

async function graphApiWrapperGet(url: string, accessToken?: string): Promise<any> {
    console.log('graphApiWrapperGet:', 'url', url);
    const headers = {
        "Content-Type": "application/json",
    };
    if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return fetch(`https://graph.facebook.com/${graph_api_version}${url}`, {
        method: 'GET',
        headers,
        cache: 'no-store'
    })
        .then(response => response.json())
        .then(response => {
            if (response.error) {
                console.log('graphApiWrapperGetResponse:', 'url', url, 'error', JSON.stringify(response.error, null, 2));
            } else {
                console.log('graphApiWrapperGetResponse:', 'url', url, 'response');
            }
            return response;
        })
}

async function graphApiWrapperPost(url: string, accessToken: string, params = {}): Promise<any> {
    console.log('graphApiWrapperPost:', 'url', url, 'params', JSON.stringify(params, null, 2));
    const headers = {
        "Content-Type": "application/json",
    };
    if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return fetch(`https://graph.facebook.com/${graph_api_version}${url}`, {
        method: 'POST',
        headers,
        cache: 'no-store',
        body: JSON.stringify(params)
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.log('graphApiWrapperPostError:', 'url', url, 'error', JSON.stringify(data.error, null, 2));
            } else {
                console.log('graphApiWrapperPostResponse:', 'url', url, 'response', JSON.stringify(data.error, null, 2));
            }
            return data;
        })
}

//////////////////////////////////////////////////////////
// SQL
//////////////////////////////////////////////////////////

export async function getAckBotStatus(phoneId: string): Promise<boolean> {
    const { rows }: { rows: { is_ack_bot_enabled: string }[] } = await sql`SELECT is_ack_bot_enabled FROM phones WHERE phone_id = ${phoneId}`;
    const isAckBotEnabled = rows[0]?.is_ack_bot_enabled === 'true';
    return isAckBotEnabled;
}

export async function setAckBotStatus(phoneId: string, isAckBotEnabled: boolean): Promise<SqlResult> {
    console.log('isAckBotEnabled', isAckBotEnabled);
    return await sql`
        INSERT INTO phones (phone_id, is_ack_bot_enabled)
        VALUES (${phoneId}, ${isAckBotEnabled})
        ON CONFLICT (phone_id)
        DO UPDATE SET is_ack_bot_enabled = EXCLUDED.is_ack_bot_enabled
    `;
}

//////////////////////////////////////////////////////////
// App Details
//////////////////////////////////////////////////////////

export async function getAppDetails(app_id: string): Promise<AppDetails> {
    const privateConfig = await getPrivateConfig();
    console.log('getBusinessIdForApp:', 'app_id', app_id);
    const url = `/${app_id}?fields=client_config,name,logo_url,app_domains,app_type,company,link,config_ids`;
    return graphApiWrapperGet(url, `${publicConfig.app_id}|${privateConfig.fb_app_secret}`)
        .then(data => {
            // console.log('getAppDetailsResponse:', 'app_id', app_id, 'data', data);
            if (data.error) throw data.error;
            return data;
        });
}

//////////////////////////////////////////////////////////
// Datasets
//////////////////////////////////////////////////////////

export async function getDatasets(user_id: string): Promise<DatasetWithDetails[]> {
    // Get dataset IDs and access tokens from the database
    const { rows }: { rows: DatasetRow[] } = await sql`
    SELECT DISTINCT dataset_id, access_token, business_id
    FROM datasets
    WHERE user_id = ${user_id}
    ORDER BY dataset_id ASC
  `;

    // Fetch dataset details from Facebook Graph API
    const datasetsWithDetails: DatasetWithDetails[] = await Promise.all(
        rows.map(async (dataset: DatasetRow) => {
            try {
                const response = await fetch(
                    `https://graph.facebook.com/${graph_api_version}/${dataset.dataset_id}?fields=name,code,last_fired_time&access_token=${dataset.access_token}`
                );
                const data = await response.json();
                return {
                    id: dataset.dataset_id,
                    name: data.name || 'Unnamed Dataset',
                    code: data.code || `fbq('init', '${dataset.dataset_id}');`,
                    status: 'Active',
                    last_fired_time: data.last_fired_time || null,
                    access_token: dataset.access_token,
                    business_id: dataset.business_id
                };
            } catch (error) {
                console.error(`Error fetching details for dataset ${dataset.dataset_id}:`, error);
                return {
                    id: dataset.dataset_id,
                    name: 'Error Loading dataset',
                    code: `fbq('init', '${dataset.dataset_id}');`,
                    status: 'Error',
                    last_fired_time: null,
                    access_token: dataset.access_token,
                    business_id: dataset.business_id
                };
            }
        })
    );
    return datasetsWithDetails;
}

//////////////////////////////////////////////////////////
// Catalogs
//////////////////////////////////////////////////////////

export async function getCatalogs(user_id: string): Promise<CatalogWithDetails[]> {
    // Get catalog IDs and access tokens from the database
    const { rows }: { rows: CatalogRow[] } = await sql`
    SELECT DISTINCT catalog_id, access_token, business_id
    FROM catalogs
    WHERE user_id = ${user_id}
    ORDER BY catalog_id ASC
  `;

    // Fetch catalog details from Facebook Graph API
    const catalogsWithDetails: CatalogWithDetails[] = await Promise.all(
        rows.map(async (catalog: CatalogRow) => {
            try {
                const response = await fetch(
                    `https://graph.facebook.com/${graph_api_version}/${catalog.catalog_id}?fields=name&access_token=${catalog.access_token}`
                );
                const data = await response.json();
                console.log('catalog!*!', data);
                return {
                    id: catalog.catalog_id,
                    name: data.name || 'Unnamed Catalog!',
                    access_token: catalog.access_token,
                    business_id: catalog.business_id
                };
            } catch (error) {
                console.error(`Error fetching details for catalog ${catalog.catalog_id}:`, error);
                return {
                    id: catalog.catalog_id,
                    name: 'Error Loading Catalog',
                    access_token: catalog.access_token,
                    business_id: catalog.business_id
                };
            }
        })
    );
    return catalogsWithDetails;
}

//////////////////////////////////////////////////////////
// Instagram Accounts
//////////////////////////////////////////////////////////

export async function getInstagramAccounts(user_id: string): Promise<InstagramAccountWithDetails[]> {
    // Get Instagram account IDs and access tokens from the database
    const { rows }: { rows: InstagramAccountRow[] } = await sql`
    SELECT DISTINCT instagram_account_id, access_token, business_id
    FROM instagram_accounts
    WHERE user_id = ${user_id}
    ORDER BY instagram_account_id ASC
  `;

    // Fetch Instagram account details from Facebook Graph API
    const instagramAccountsWithDetails: InstagramAccountWithDetails[] = await Promise.all(
        rows.map(async (account: InstagramAccountRow) => {
            try {
                const response = await fetch(
                    `https://graph.facebook.com/${graph_api_version}/${account.instagram_account_id}?fields=ig_username&access_token=${account.access_token}`
                );
                const data = await response.json();
                return {
                    id: account.instagram_account_id,
                    username: data.username || data.name || data.ig_username || 'unknown',
                    access_token: account.access_token,
                    business_id: account.business_id
                };
            } catch (error) {
                console.error(`Error fetching details for Instagram account ${account.instagram_account_id}:`, error);
                return {
                    id: account.instagram_account_id,
                    username: 'unknown',
                    access_token: account.access_token,
                    business_id: account.business_id
                };
            }
        })
    );
    return instagramAccountsWithDetails;
}
