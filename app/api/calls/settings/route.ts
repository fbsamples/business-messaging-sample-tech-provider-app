// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { type NextRequest, NextResponse } from 'next/server';

import { graphApiGetCallSettings, graphApiUpdateCallSettings } from '@/app/api/beUtils';
import { withAuth } from '@/app/api/authWrapper';

export const GET = withAuth(async function getCallSettings(request: NextRequest, session) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumberId = searchParams.get('phoneNumberId');
    const wabaId = searchParams.get('wabaId');

    if (!phoneNumberId || !wabaId) {
      return NextResponse.json({ error: 'Missing required query params' }, { status: 400 });
    }

    const result = await graphApiGetCallSettings(session.user.email!, wabaId, phoneNumberId);

    if (result.error) {
      return NextResponse.json({ error: result.error.message || 'Graph API error' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get call settings:', error);
    return NextResponse.json({ error: 'Failed to get call settings' }, { status: 500 });
  }
});

export const POST = withAuth(async function updateCallSettings(request: NextRequest, session) {
  try {
    const { phoneNumberId, wabaId, enabled } = await request.json();

    if (!phoneNumberId || !wabaId || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await graphApiUpdateCallSettings(session.user.email!, wabaId, phoneNumberId, enabled);

    if (result.error) {
      return NextResponse.json({ error: result.error.message || 'Graph API error' }, { status: 400 });
    }

    return NextResponse.json({ status: 'ok', success: result.success });
  } catch (error) {
    console.error('Failed to update call settings:', error);
    return NextResponse.json({ error: 'Failed to update call settings' }, { status: 500 });
  }
});
