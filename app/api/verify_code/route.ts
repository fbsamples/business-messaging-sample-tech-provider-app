// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { type NextRequest, NextResponse } from 'next/server'
import { getTokenForWaba, verifyCode } from "../be_utils"
import { withAuth } from "../auth_wrapper";

export const POST = withAuth(async function verifyCodeEndpoint(request: NextRequest, _session) {
    const body = await request.json();
    const { wabaId, phoneId, otpCode } = body;
    const accessToken = await getTokenForWaba(wabaId);
    await verifyCode(phoneId, accessToken, otpCode);
    return new NextResponse('{"register":"ok"}');
});
