// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { type NextRequest, NextResponse } from 'next/server';

import { graphApiSendCallPermissionRequest } from '@/app/api/beUtils';
import { withAuth } from '@/app/api/authWrapper';

export const POST = withAuth(async function requestCallPermission(request: NextRequest, session) {
  try {
    const { phoneNumberId, wabaId, to, bodyText } = await request.json();

    if (!phoneNumberId || !wabaId || !to) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const text = bodyText || "Hi, we'd like to call you regarding your recent inquiry. Please grant permission so we can connect.";

    const result = await graphApiSendCallPermissionRequest(
      session.user.email!,
      wabaId,
      phoneNumberId,
      to,
      text,
    );

    if (result.error) {
      console.error('Graph API permission request error:', result.error);
      return NextResponse.json({ error: result.error.message || 'Graph API error' }, { status: 400 });
    }

    return NextResponse.json({ status: 'ok', messageId: result.messages?.[0]?.id });
  } catch (error) {
    console.error('Failed to send call permission request:', error);
    return NextResponse.json({ error: 'Failed to send call permission request' }, { status: 500 });
  }
});
