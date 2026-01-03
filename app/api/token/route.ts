// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { NextResponse, type NextRequest } from 'next/server'
import { getToken, saveTokens, registerNumber, subscribeWebhook } from "../be_utils"
import { wrapFn, skipProm } from "../../errorformat";
import { withAuth } from "../auth_wrapper";

export const POST = withAuth(async function myApiRoute(request: NextRequest, session) {
    const user = session.user;
    console.log("this is the user', user", user.email);

    const user_id = user.email;


    const data = await request.json();

    console.log("/token", "incoming data", data);

    const { code, waba_id, waba_ids, business_id, ad_account_ids, page_ids, dataset_ids, catalog_ids, instagram_account_ids, app_id, phone_number_id, es_option_reg, es_option_loc, es_option_sys, es_option_sub } = data;

    console.log("/token", "waba_ids", waba_ids, "app_id", app_id, "phone_number_id", phone_number_id, "es_option_reg", es_option_reg, "es_option_loc", es_option_loc, "es_option_sys", es_option_sys, "es_option_sub", es_option_sub);

    let response = null;

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
        response = new NextResponse(JSON.stringify(result, null, 2));
    } catch (e) {
        console.log("error", e);
        response = new NextResponse(JSON.stringify(e, null, 2), { status: 500 });
    }

    return response;
});
