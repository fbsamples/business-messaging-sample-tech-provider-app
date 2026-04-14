// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { type NextRequest, NextResponse } from 'next/server';

import { graphApiCallAction } from '@/app/api/beUtils';
import { withAuth } from '@/app/api/authWrapper';

export const POST = withAuth(async function rejectCall(request: NextRequest, session) {
  try {
    const { phoneNumberId, wabaId, callId } = await request.json();

    if (!phoneNumberId || !wabaId || !callId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await graphApiCallAction(session.user.email!, wabaId, phoneNumberId, {
      messaging_product: 'whatsapp',
      call_id: callId,
      action: 'reject',
    });

    return NextResponse.json({ status: 'ok', data: result });
  } catch (error) {
    console.error('Failed to reject call:', error);
    return NextResponse.json({ error: 'Failed to reject call' }, { status: 500 });
  }
});
