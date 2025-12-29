// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { type NextRequest, NextResponse } from 'next/server'
import { deregisterNumber, getTokenForWaba } from "../be_utils"
import { withAuth } from "../auth_wrapper";

async function handleDeregister(request: NextRequest, _user: any) {
    const body = await request.json();
    const { wabaId, phoneId } = body;
    const acesssToken = await getTokenForWaba(wabaId);
    await deregisterNumber(phoneId, acesssToken); // TODO: need error handling
    return new NextResponse(JSON.stringify({ response: 'ok' }));
}

export const POST = withAuth(handleDeregister);
