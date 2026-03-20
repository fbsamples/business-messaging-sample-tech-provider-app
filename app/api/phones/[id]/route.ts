// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { type NextRequest, NextResponse } from 'next/server'
import { setAckBotStatus, getAckBotMessage } from "../../be_utils"
import { withAuth } from "../../auth_wrapper";

export const POST = withAuth(async function phones(request: NextRequest, _session) {
    const body = await request.json();
    const { isAckBotEnabled, phoneId, ackBotMessage } = body;
    const resp = await setAckBotStatus(phoneId, isAckBotEnabled, ackBotMessage);
    console.log('done', resp);
    return new NextResponse(JSON.stringify({ response: 'ok' }));
});

export const GET = withAuth(async function getPhoneConfig(request: NextRequest, _session) {
    const phoneId = request.nextUrl.searchParams.get("phoneId");
    if (!phoneId) {
        return new NextResponse(JSON.stringify({ error: "phoneId is required" }), { status: 400 });
    }
    const message = await getAckBotMessage(phoneId);
    return new NextResponse(JSON.stringify({ ackBotMessage: message }));
});
