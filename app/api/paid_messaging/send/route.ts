// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { type NextRequest, NextResponse } from 'next/server';
import { getTokenForWabaByUser, sendTemplateMessage } from "../../beUtils";
import { withAuth } from "../../authWrapper";
import publicConfig from "@/app/publicConfig";

const E164_REGEX = /^\+\d{7,15}$/;

export const POST = withAuth(async function sendTemplateRoute(request: NextRequest, session: any) {
    const body = await request.json();
    const { waba_id, phone_number_id, template_name, template_language, recipient, component_params } = body;

    // Validate required fields
    if (!waba_id || !phone_number_id || !template_name || !template_language || !recipient) {
        return NextResponse.json(
            { error: 'Missing required fields: waba_id, phone_number_id, template_name, template_language, recipient' },
            { status: 400 }
        );
    }

    // Validate E.164 format
    if (!E164_REGEX.test(recipient)) {
        return NextResponse.json(
            { error: 'Phone number must be in E.164 format (e.g., +1234567890)' },
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
        const result = await sendTemplateMessage(
            phone_number_id,
            access_token,
            recipient,
            template_name,
            template_language,
            component_params || []
        );
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            {
                error: error.message || 'Failed to send template message',
                graphApiError: error.graphApiError || undefined,
            },
            { status: error.status || 500 }
        );
    }
});
