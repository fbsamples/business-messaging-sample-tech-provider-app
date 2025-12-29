// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


export const dynamic = 'force-dynamic'; // static by default, unless reading the request
import { type NextRequest, NextResponse } from 'next/server'
import Ably from 'ably';
import { withAuth } from "../auth_wrapper";

async function createTokenRequest(clientId: string) {
    const ably_key = process.env.ABLY_KEY;
    const ably = new Ably.Realtime(ably_key);
    const r = await ably.auth.createTokenRequest({
        ttl: 5000,
        clientId: clientId
    }, {
        key: ably_key
    });
    ably.close();
    return r;
}

export const GET = withAuth(async function myApiRoute(_request: NextRequest, session) {
    console.log('session ably_auth');
    console.log(session);
    const user = session.user;
    const clientId = user.email;
    const tokenRequest_outer = await createTokenRequest(clientId);
    const response = new NextResponse(JSON.stringify(tokenRequest_outer), { status: 200 });
    return response;
});