// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { type NextRequest, NextResponse } from 'next/server';
import { getTokenForWabaByUser, getMessageTemplates } from "../../beUtils";
import { withAuth } from "../../authWrapper";
import publicConfig from "@/app/publicConfig";

export const GET = withAuth(async function templatesRoute(request: NextRequest, session: any) {
    const { searchParams } = new URL(request.url);
    const waba_id = searchParams.get('waba_id');

    if (!waba_id) {
        return NextResponse.json(
            { error: 'waba_id query parameter is required' },
            { status: 400 }
        );
    }

    const user_id = session.user.email;
    const app_id = publicConfig.appId;

    const access_token = await getTokenForWabaByUser(waba_id, user_id, app_id);
    if (!access_token) {
        return NextResponse.json(
            { error: 'You do not have access to this WABA' },
            { status: 403 }
        );
    }

    try {
        const templates = await getMessageTemplates(waba_id, access_token);
        return NextResponse.json({ templates });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch templates' },
            { status: 500 }
        );
    }
});
