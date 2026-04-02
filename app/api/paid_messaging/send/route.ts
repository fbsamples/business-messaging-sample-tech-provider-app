// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { type NextRequest, NextResponse } from 'next/server';

import { getTokenForWabaByUser, sendTemplateMessage, checkWabaPaymentMethod } from '@/app/api/beUtils';
import { withAuth } from '@/app/api/authWrapper';
import type { AuthSession } from '@/app/api/authWrapper';
import publicConfig from '@/app/publicConfig';

const E164_REGEX = /^\+\d{7,15}$/;

export const POST = withAuth(async function sendTemplateRoute(request: NextRequest, session: AuthSession) {
  try {
    const body = await request.json();
    const {
      waba_id: wabaId,
      phone_number_id: phoneNumberId,
      template_name: templateName,
      template_language: templateLanguage,
      recipient,
      component_params: componentParams,
    } = body;

    // Validate required fields
    if (!wabaId || !phoneNumberId || !templateName || !templateLanguage || !recipient) {
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

    const userId = session.user.email;
    const appId = publicConfig.appId;

    const accessToken = await getTokenForWabaByUser(wabaId, userId, appId);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'You do not have access to this WABA' },
        { status: 403 }
      );
    }

    // Verify WABA has a payment method before allowing template sends
    const hasPaymentMethod = await checkWabaPaymentMethod(wabaId, accessToken);
    if (!hasPaymentMethod) {
      return NextResponse.json(
        { error: 'This WABA does not have a payment method. Add a payment method in WhatsApp Business Manager to send template messages.' },
        { status: 403 }
      );
    }

    const result = await sendTemplateMessage(
      phoneNumberId,
      accessToken,
      recipient,
      templateName,
      templateLanguage,
      componentParams || []
    );
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Failed to send template message');
    const status = (error as { status?: number }).status || 500;
    const graphApiError = (error as { graphApiError?: unknown }).graphApiError;
    return NextResponse.json(
      {
        error: err.message,
        graphApiError: graphApiError || undefined,
      },
      { status }
    );
  }
});
