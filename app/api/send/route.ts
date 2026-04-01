// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { type NextRequest, NextResponse } from 'next/server'
import { send, getTokenForWaba } from "../be_utils"
import { withAuth } from "../auth_wrapper";

export const POST = withAuth(async function sendMessage(request: NextRequest, session) {
    try {
        const body = await request.json();
        const { waba_id, phone_number_id, dest_phone, message_content } = body;

        if (!waba_id || typeof waba_id !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid waba_id' }, { status: 400 });
        }
        if (!phone_number_id || typeof phone_number_id !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid phone_number_id' }, { status: 400 });
        }
        if (!dest_phone || typeof dest_phone !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid dest_phone' }, { status: 400 });
        }
        if (!message_content || typeof message_content !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid message_content' }, { status: 400 });
        }

        const accessToken = await getTokenForWaba(waba_id, session.user.email);
        const result = await send(phone_number_id, accessToken, dest_phone, message_content);
        return NextResponse.json({ status: 'ok', data: result });
    } catch (error) {
        console.error('Failed to send message:', error);
        return NextResponse.json(
            { error: 'Failed to send message' },
            { status: 500 }
        );
    }
});
