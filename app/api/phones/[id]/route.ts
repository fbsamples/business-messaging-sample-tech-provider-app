// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { type NextRequest, NextResponse } from 'next/server'
import { setAckBotStatus, getAckBotMessage } from "../../be_utils"
import { withAuth } from "../../auth_wrapper";

export const POST = withAuth(async function updateAckBotStatus(request: NextRequest, _session) {
    try {
        const body = await request.json();
        const { isAckBotEnabled, phoneId } = body;

        if (!phoneId || typeof phoneId !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid phoneId' }, { status: 400 });
        }
        if (typeof isAckBotEnabled !== 'boolean') {
            return NextResponse.json({ error: 'Missing or invalid isAckBotEnabled' }, { status: 400 });
        }

        await setAckBotStatus(phoneId, isAckBotEnabled);
        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Failed to update ack bot status:', error);
        return NextResponse.json(
            { error: 'Failed to update ack bot status' },
            { status: 500 }
        );
    }
});

export const GET = withAuth(async function getPhoneConfig(request: NextRequest) {
    const phoneId = request.nextUrl.searchParams.get("phoneId");
    if (!phoneId) {
        return new NextResponse(JSON.stringify({ error: "phoneId is required" }), { status: 400 });
    }
    const message = await getAckBotMessage(phoneId);
    return new NextResponse(JSON.stringify({ ackBotMessage: message }));
});
