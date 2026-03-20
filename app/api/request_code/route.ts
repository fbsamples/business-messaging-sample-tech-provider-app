// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { type NextRequest, NextResponse } from 'next/server'
import { getTokenForWaba, requestCode } from "../be_utils"
import { withAuth } from "../auth_wrapper";

export const POST = withAuth(async function requestCodeEndpoint(request: NextRequest, _session) {
    try {
        const body = await request.json();
        const waba_id = body.waba_id;
        const accessToken = await getTokenForWaba(waba_id);
        const phoneNumberId = body.phone_number_id;
        const data = await requestCode(phoneNumberId, accessToken);
        if (data.error) {
            throw data.error;
        }
        return NextResponse.json({ response: 'ok' });
    } catch (err: any) {
        console.error('request_code error:', err);
        const { code, message, status } = mapGraphApiError(err);
        return NextResponse.json(
            { error: true, code, message },
            { status },
        );
    }
});

function mapGraphApiError(err: any): { code: string; message: string; status: number } {
    const apiCode = err?.code;
    const apiSubcode = err?.error_subcode;

    if (apiCode === 4 || apiSubcode === 2388093) {
        return { code: 'RATE_LIMITED', message: 'Too many requests. Please wait and try again.', status: 429 };
    }
    if (apiCode === 100) {
        return { code: 'INVALID_PARAMS', message: 'Invalid parameters provided.', status: 400 };
    }
    return { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred. Please try again.', status: 500 };
}