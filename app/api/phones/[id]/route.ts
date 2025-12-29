// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { type NextRequest, NextResponse } from 'next/server'
import { setAckBotStatus } from "../../be_utils"
import { withAuth } from "../../auth_wrapper";

export const POST = withAuth(async function phones(request: NextRequest, _session) {
    const body = await request.json();
    const { isAckBotEnabled, phoneId } = body;
    console.log(isAckBotEnabled, phoneId);
    const resp = await setAckBotStatus(phoneId, isAckBotEnabled);
    console.log('done', resp);
    return new NextResponse(JSON.stringify({ response: 'ok' }));
});
