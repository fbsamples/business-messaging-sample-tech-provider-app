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
} from '../types/api';

const { graph_api_version, redirect_uri } = publicConfig;

export async function getToken(code: string, app_id: string): Promise<string> {
    const privateConfig = await getPrivateConfig();
    const { fb_app_secret: app_secret } = privateConfig;
    console.log('getToken:', 'appId', app_id);
    // OAuth token exchange requires client_secret as a query parameter per Meta's API spec
    const url = `/oauth/access_token?client_id=${app_id}&redirect_uri=${redirect_uri}&client_secret=${app_secret}&code=${code}`;
    return graphApiWrapperGet(url)
        .then(data => {
            console.log('getTokenResponse:', 'appId', app_id);
            if (data.error) throw data.error;
            return data.access_token;
        });
}

export async function subscribeWebhook(access_token: string, waba_id: string): Promise<SubscribeWebhookResponse> {
    console.log('subscribeWebhook:', 'wabaId', waba_id);
    const url = `/${waba_id}/subscribed_apps`;
    return graphApiWrapperPost(url, access_token)
        .then(data => {
            console.log('subscribeWebhookResponse:', 'wabaId', waba_id);
            if (data.error) throw data.error;
            return data;
        });
}

async function saveWabaToken(access_token: string, waba_id: string, app_id: string, user_id: string, business_id: string): Promise<SqlResult> {
    console.log('saveWabaToken:', 'access_token', access_token, 'waba_id', waba_id, 'app_id', app_id, 'business_id', business_id);

    return await sql`
        INSERT INTO wabas (user_id, app_id, waba_id, access_token, business_id, last_updated)
        VALUES (${user_id}, ${app_id}, ${waba_id}, ${access_token}, ${business_id}, current_timestamp)
        ON CONFLICT (user_id, app_id, waba_id)
        DO UPDATE SET access_token = EXCLUDED.access_token, business_id = EXCLUDED.business_id, last_updated=current_timestamp
    `;
}

async function savePageToken(access_token: string, page_id: string, app_id: string, user_id: string, business_id: string): Promise<SqlResult> {
    console.log('savePageToken:', 'access_token', access_token, 'page_id', page_id, 'app_id', app_id, 'business_id', business_id);

    return await sql`
        INSERT INTO pages (user_id, app_id, page_id, access_token, business_id, last_updated)
        VALUES (${user_id}, ${app_id}, ${page_id}, ${access_token}, ${business_id}, current_timestamp)
        ON CONFLICT (user_id, app_id, page_id)
        DO UPDATE SET access_token = EXCLUDED.access_token, business_id = EXCLUDED.business_id, last_updated=current_timestamp
    `;
}

async function saveAdAccountToken(access_token: string, ad_account_id: string, app_id: string, user_id: string, business_id: string): Promise<SqlResult> {
    console.log('saveAdAccountToken:', 'access_token', access_token, 'ad_account_id', ad_account_id, 'app_id', app_id, 'business_id', business_id);

    return await sql`
        INSERT INTO ad_accounts (user_id, app_id, ad_account_id, access_token, business_id, last_updated)
        VALUES (${user_id}, ${app_id}, ${ad_account_id}, ${access_token}, ${business_id}, current_timestamp)
        ON CONFLICT (user_id, app_id, ad_account_id)
        DO UPDATE SET access_token = EXCLUDED.access_token, business_id = EXCLUDED.business_id, last_updated=current_timestamp
    `;
}

async function saveDatasetToken(access_token: string, dataset_id: string, app_id: string, user_id: string, business_id: string): Promise<SqlResult> {
    console.log('saveDatasetToken:', 'access_token', access_token, 'dataset_id', dataset_id, 'app_id', app_id, 'business_id', business_id);

    return await sql`
        INSERT INTO datasets (user_id, app_id, dataset_id, access_token, business_id, last_updated)
        VALUES (${user_id}, ${app_id}, ${dataset_id}, ${access_token}, ${business_id}, current_timestamp)
        ON CONFLICT (user_id, app_id, dataset_id)
        DO UPDATE SET access_token = EXCLUDED.access_token, business_id = EXCLUDED.business_id, last_updated=current_timestamp
    `;
}

async function saveCatalogToken(access_token: string, catalog_id: string, app_id: string, user_id: string, business_id: string): Promise<SqlResult> {
    console.log('saveCatalogToken:', 'access_token', access_token, 'catalog_id', catalog_id, 'app_id', app_id, 'business_id', business_id);

    return await sql`
        INSERT INTO catalogs (user_id, app_id, catalog_id, access_token, business_id, last_updated)
        VALUES (${user_id}, ${app_id}, ${catalog_id}, ${access_token}, ${business_id}, current_timestamp)
        ON CONFLICT (user_id, app_id, catalog_id)
        DO UPDATE SET access_token = EXCLUDED.access_token, business_id = EXCLUDED.business_id, last_updated=current_timestamp
    `;
}

async function saveInstagramAccountToken(access_token: string, instagram_account_id: string, app_id: string, user_id: string, business_id: string): Promise<SqlResult> {
    console.log('saveInstagramAccountToken:', 'access_token', access_token, 'instagram_account_id', instagram_account_id, 'app_id', app_id, 'business_id', business_id);

    return await sql`
        INSERT INTO instagram_accounts (user_id, app_id, instagram_account_id, access_token, business_id, last_updated)
        VALUES (${user_id}, ${app_id}, ${instagram_account_id}, ${access_token}, ${business_id}, current_timestamp)
        ON CONFLICT (user_id, app_id, instagram_account_id)
        DO UPDATE SET access_token = EXCLUDED.access_token, business_id = EXCLUDED.business_id, last_updated=current_timestamp
    `;
}

async function saveBusinessToken(access_token: string, business_id: string, app_id: string, user_id: string): Promise<SqlResult> {
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
    console.log('registerNumber:', 'phoneId', phoneId);
    const url = `/${phoneId}/register`;
    return graphApiWrapperPost(url, accessToken, {
        "messaging_product": "whatsapp",
        "pin": fb_reg_pin
    })
        .then(data => {
            console.log('registerNumberResponse:', 'phoneId', phoneId);
            if (data.error) throw data.error;
            return data;
        })
}

export async function deregisterNumber(phoneId: string, accessToken: string): Promise<DeregisterNumberResponse> {
    console.log('deregisterNumber:', 'phoneId', phoneId);
    const url = `/${phoneId}/deregister`;
    return graphApiWrapperPost(url, accessToken)
        .then(data => {
            console.log('deregisterNumberResponse:', 'phoneId', phoneId);
            if (data.error) throw data.error;
            return data;
        })
}

export async function send(phone_number_id: string, accessToken: string, dest_phone: string, message_content: string): Promise<SendMessageResponse> {
    console.log('send:', 'phoneNumberId', phone_number_id);
    const url = `/${phone_number_id}/messages`;
    return graphApiWrapperPost(url, accessToken, {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": dest_phone,
        "type": "text",
        "text": {
            "preview_url": false,
            "body": message_content
        }
    })
        .then(data => {
            if (data.error) throw data.error;
            return data;
        });
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

async function getWabaDetails(wabaId: string, accessToken: string): Promise<WabaDetails> {
    const url = `/${wabaId}?fields=account_review_status,purchase_order_number,audiences,name,ownership_type,subscribed_apps,business_verification_status,country,currency,timezone_id,on_behalf_of_business_info,schedules,is_enabled_for_insights,message_templates,phone_numbers`;
    return graphApiWrapperGet(url, accessToken);
}

//////////////////////////////////////////////////////////
// Phones
//////////////////////////////////////////////////////////

async function getWabaRows(userId: string): Promise<WabaRow[]> {
    const { rows }: { rows: WabaRow[] } = await sql`SELECT DISTINCT ON (waba_id) access_token, waba_id, business_id FROM wabas WHERE user_id = ${userId}`;
    return rows;
}

export async function getClientPhones(userId: string): Promise<ClientPhone[]> {
    const rows: WabaRow[] = await getWabaRows(userId);
    const nested_phones: PhoneDetails[][] = await Promise.all(rows.map(async (row: WabaRow) => {
        const wabaId: string = row.waba_id;
        const accessToken: string = row.access_token;
        const data = await graphApiWrapperGet(`/${wabaId}?fields=phone_numbers`, accessToken);
        const phones: PhoneNumber[] = data?.phone_numbers?.data || [];
        const phone_deets: PhoneDetails[] = await Promise.all(phones.map(async (phone: PhoneNumber) => {
            return await getPhoneDetails(phone.id, accessToken, wabaId);
        }));
        return phone_deets;
    }));
    return nested_phones.flat() as ClientPhone[];
};

async function getPhoneDetails(phoneId: string, accessToken: string, wabaId: string): Promise<PhoneDetails> {
    return graphApiWrapperGet(`/${phoneId}?fields=status,account_mode,certificate,is_on_biz_app,display_phone_number,code_verification_status`, accessToken)
        .then(async data => {
            data.wabaId = wabaId;
            const isAckBotEnabled = await getAckBotStatus(phoneId);
            data.isAckBotEnabled = isAckBotEnabled;
            return data;
        });
};

export async function getTokenForWaba(waba_id: string, user_id: string): Promise<string> {
    console.log('getTokenForWaba:', 'wabaId', waba_id);
    const { rows }: { rows: { access_token: string }[] } = await sql`SELECT access_token FROM wabas WHERE waba_id = ${waba_id} AND user_id = ${user_id}`;
    return rows[0].access_token;
}

//////////////////////////////////////////////////////////
// Verification Request \/
//////////////////////////////////////////////////////////

export async function requestCode(phoneId: string, accessToken: string): Promise<RequestCodeResponse> {
    console.log('requestCode:', 'phoneId', phoneId);
    const url = `/${phoneId}/request_code?code_method=SMS&language=en`;
    return graphApiWrapperPost(url, accessToken);
}

export async function verifyCode(phoneId: string, accessToken: string, otpCode: string): Promise<VerifyCodeResponse> {
    console.log('verifyCode:', 'phoneId', phoneId);
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
                const data = await graphApiWrapperGet(`/${page.page_id}?fields=name,ad_campaign`, page.access_token);
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
                const data = await graphApiWrapperGet(`/act_${account.ad_account_id}?fields=name`, account.access_token);
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
// Request Wrappers
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

// Note: phones table does not have a user_id column, so this query is not user-scoped
export async function getAckBotStatus(phoneId: string): Promise<boolean> {
    const { rows }: { rows: { is_ack_bot_enabled: string }[] } = await sql`SELECT is_ack_bot_enabled FROM phones WHERE phone_id = ${phoneId}`;
    const isAckBotEnabled = rows[0]?.is_ack_bot_enabled === 'true';
    return isAckBotEnabled;
}

export async function getAckBotMessage(phoneId: string): Promise<string> {
    const { rows }: { rows: { ack_bot_message?: string }[] } = await sql`SELECT ack_bot_message FROM phones WHERE phone_id = ${phoneId}`;
    return rows[0]?.ack_bot_message || '';
}

export async function setAckBotStatus(phoneId: string, isAckBotEnabled: boolean, ackBotMessage?: string): Promise<SqlResult> {
    console.log('isAckBotEnabled', isAckBotEnabled, 'ackBotMessage', ackBotMessage);
    if (ackBotMessage !== undefined) {
        return await sql`
            INSERT INTO phones (phone_id, is_ack_bot_enabled, ack_bot_message)
            VALUES (${phoneId}, ${isAckBotEnabled}, ${ackBotMessage})
            ON CONFLICT (phone_id)
            DO UPDATE SET is_ack_bot_enabled = EXCLUDED.is_ack_bot_enabled, ack_bot_message = EXCLUDED.ack_bot_message
        `;
    }
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
    console.log('getAppDetails:', 'appId', app_id);
    const url = `/${app_id}?fields=client_config,name,logo_url,app_domains,app_type,company,link,config_ids`;
    return graphApiWrapperGet(url, `${publicConfig.app_id}|${privateConfig.fb_app_secret}`)
        .then(data => {
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
                const data = await graphApiWrapperGet(`/${dataset.dataset_id}?fields=name,code,last_fired_time`, dataset.access_token);
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
                const data = await graphApiWrapperGet(`/${catalog.catalog_id}?fields=name`, catalog.access_token);
                return {
                    id: catalog.catalog_id,
                    name: data.name || 'Unnamed Catalog',
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

    // Build IG account ID -> username map using page tokens.
    // The ES user token typically lacks instagram_basic scope, so querying
    // /{ig_id}?fields=username directly returns an error.
    // Instead we use the page token (which has pages_show_list scope) to call
    // /{page_id}?fields=instagram_business_account{id,username,name} and map
    // the linked IG account ID to its username.
    const { rows: pageRows }: { rows: { page_id: string; access_token: string }[] } = await sql`
    SELECT DISTINCT page_id, access_token
    FROM pages
    WHERE user_id = ${user_id}
  `;

    const igUsernameMap: Record<string, string> = {};
    await Promise.all(
        pageRows.map(async (page) => {
            try {
                const res = await fetch(
                    `https://graph.facebook.com/${graph_api_version}/${page.page_id}?fields=instagram_business_account{id,username,name}&access_token=${page.access_token}`
                );
                const data = await res.json();
                const iga = data?.instagram_business_account;
                if (iga?.id) {
                    igUsernameMap[iga.id] = iga.username || iga.name || '';
                }
            } catch {
                // best-effort; ignore individual page failures
            }
        })
    );

    // Fetch Instagram account details from Facebook Graph API
    const instagramAccountsWithDetails: InstagramAccountWithDetails[] = await Promise.all(
        rows.map(async (account: InstagramAccountRow) => {
            // Primary: use username resolved via page token
            const resolvedUsername = igUsernameMap[account.instagram_account_id];
            if (resolvedUsername) {
                return {
                    id: account.instagram_account_id,
                    username: resolvedUsername,
                    access_token: account.access_token,
                    business_id: account.business_id
                };
            }
            // Fallback: query the IG ID directly (works if token has instagram_basic scope)
            try {
                const response = await fetch(
                    `https://graph.facebook.com/${graph_api_version}/${account.instagram_account_id}?fields=username,name&access_token=${account.access_token}`
                );
                const data = await response.json();
                if (data.username || data.name) {
                    return {
                        id: account.instagram_account_id,
                        username: data.username || data.name,
                        access_token: account.access_token,
                        business_id: account.business_id
                    };
                }
                console.warn(`Instagram ${account.instagram_account_id} Graph API response:`, JSON.stringify(data));
            } catch (error) {
                console.error(`Error fetching details for Instagram account ${account.instagram_account_id}:`, error);
            }
            return {
                id: account.instagram_account_id,
                username: 'unknown',
                access_token: account.access_token,
                business_id: account.business_id
            };
        })
    );
    return instagramAccountsWithDetails;
}
