// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { type NextRequest, NextResponse } from 'next/server';

import { getTokenForWabaByUser, getMessageTemplates } from '@/app/api/beUtils';
import { withAuth } from '@/app/api/authWrapper';
import type { AuthSession } from '@/app/api/authWrapper';
import publicConfig from '@/app/publicConfig';

export const GET = withAuth(async function templatesRoute(request: NextRequest, session: AuthSession) {
    try {
        const { searchParams } = new URL(request.url);
        const wabaId = searchParams.get('waba_id');

        if (!wabaId) {
            return NextResponse.json(
                { error: 'waba_id query parameter is required' },
                { status: 400 }
            );
        }

        const userId = session.user.email;
        const appId = publicConfig.appId;

        const accessToken = await getTokenForWabaByUser(wabaId, userId, appId);
        if (!accessToken) {
            return NextResponse.json(
                { error: 'You do not have access to this WABA' },
                { status: 403 }
            );
        }

        const templates = await getMessageTemplates(wabaId, accessToken);
        return NextResponse.json({ templates });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch templates';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
});
