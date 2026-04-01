// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { type NextRequest, NextResponse } from 'next/server'
import { getTokenForWaba, requestCode } from "../be_utils"
import { withAuth } from "../auth_wrapper";

export const POST = withAuth(async function requestCodeEndpoint(request: NextRequest, session) {
    try {
        const body = await request.json();
        const { waba_id, phone_number_id } = body;

        if (!waba_id || typeof waba_id !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid waba_id' }, { status: 400 });
        }
        if (!phone_number_id || typeof phone_number_id !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid phone_number_id' }, { status: 400 });
        }

        const accessToken = await getTokenForWaba(waba_id, session.user.email);
        await requestCode(phone_number_id, accessToken);
        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Failed to request verification code:', error);
        return NextResponse.json(
            { error: 'Failed to request verification code' },
            { status: 500 }
        );
    }
});