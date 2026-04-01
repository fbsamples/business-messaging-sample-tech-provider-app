// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { type NextRequest, NextResponse } from 'next/server'
import { deregisterNumber, getTokenForWaba } from "@/app/api/beUtils"
import { withAuth } from "@/app/api/authWrapper";

export const POST = withAuth(async function handleDeregister(request: NextRequest, session) {
    try {
        const body = await request.json();
        const { wabaId, phoneId } = body;

        if (!wabaId || typeof wabaId !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid wabaId' }, { status: 400 });
        }
        if (!phoneId || typeof phoneId !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid phoneId' }, { status: 400 });
        }

        const accessToken = await getTokenForWaba(wabaId, session.user.email);
        await deregisterNumber(phoneId, accessToken);
        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Failed to deregister phone number:', error);
        return NextResponse.json(
            { error: 'Failed to deregister phone number' },
            { status: 500 }
        );
    }
});
