// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { NextResponse } from 'next/server'
import Ably from 'ably';
import { withAuth } from "../auth_wrapper";

export const dynamic = 'force-dynamic';

async function createTokenRequest(clientId: string) {
    const ably_key = process.env.ABLY_KEY;
    const ably = new Ably.Realtime(ably_key);
    const r = await ably.auth.createTokenRequest({
        ttl: 3600000,
        clientId: clientId
    }, {
        key: ably_key
    });
    ably.close();
    return r;
}

export const GET = withAuth(async function createAblyToken(_, session) {
    try {
        const clientId = session.user.email;
        const tokenRequest = await createTokenRequest(clientId);
        return NextResponse.json(tokenRequest);
    } catch (error) {
        console.error('Failed to create Ably token:', error);
        return NextResponse.json(
            { error: 'Failed to create Ably token' },
            { status: 500 }
        );
    }
});