// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { NextResponse, type NextRequest } from 'next/server'
import { getToken, saveTokens, registerNumber, subscribeWebhook } from "../be_utils"
import { wrapFn, skipProm } from "../../errorformat";
import { withAuth } from "../auth_wrapper";

export const POST = withAuth(async function exchangeToken(request: NextRequest, session) {
    const user = session.user;

    const user_id = user.email;

    const data = await request.json();

    const { code, waba_id, waba_ids: rawWabaIds, business_id, ad_account_ids: rawAdAccountIds, page_ids: rawPageIds, dataset_ids: rawDatasetIds, catalog_ids: rawCatalogIds, instagram_account_ids: rawInstagramAccountIds, app_id, phone_number_id, es_option_reg, es_option_loc, es_option_sys, es_option_sub } = data;

    // Default arrays to [] and construct waba_ids from singular waba_id if needed
    const waba_ids = rawWabaIds || (waba_id ? [waba_id] : []);
    const page_ids = rawPageIds || [];
    const ad_account_ids = rawAdAccountIds || [];
    const dataset_ids = rawDatasetIds || [];
    const catalog_ids = rawCatalogIds || [];
    const instagram_account_ids = rawInstagramAccountIds || [];

    if (!code || typeof code !== 'string') {
        return NextResponse.json({ error: 'Missing or invalid code' }, { status: 400 });
    }
    if (!app_id || typeof app_id !== 'string') {
        return NextResponse.json({ error: 'Missing or invalid app_id' }, { status: 400 });
    }

    try {
        const result = await Promise.all([
            wrapFn(getToken(code, app_id), "getToken")
                .then(([{ fun, status, result, error }]) => {
                    const access_token = result;
                    return Promise.all([
                        wrapFn(saveTokens(user_id, app_id, business_id, page_ids, ad_account_ids, waba_ids, dataset_ids, catalog_ids, instagram_account_ids, access_token), "saveTokens"),
                        (es_option_reg && phone_number_id) ? wrapFn(registerNumber(phone_number_id, access_token), "registerNumber") : skipProm('registerNumber'),
                        (es_option_sub) ? wrapFn(subscribeWebhook(access_token, waba_id), "subscribeWebhook") : skipProm('subscribeWebhook')
                    ])
                        .then(response => [{ fun, status, result: '***', error }, response]);

                }),
        ])
        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to exchange token:', error);
        return NextResponse.json(
            { error: 'Failed to exchange token' },
            { status: 500 }
        );
    }
});
