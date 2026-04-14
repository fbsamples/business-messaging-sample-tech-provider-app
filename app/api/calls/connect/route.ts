// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { type NextRequest, NextResponse } from 'next/server';

import { graphApiCallAction } from '@/app/api/beUtils';
import { withAuth } from '@/app/api/authWrapper';

export const POST = withAuth(async function connectCall(request: NextRequest, session) {
  try {
    const { phoneNumberId, wabaId, to, sdp, sdpType } = await request.json();

    if (!phoneNumberId || !wabaId || !to || !sdp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await graphApiCallAction(session.user.email!, wabaId, phoneNumberId, {
      messaging_product: 'whatsapp',
      to,
      action: 'connect',
      session: { sdp, sdp_type: sdpType },
    });

    if (result.error) {
      console.error('Graph API connect error:', result.error);
      return NextResponse.json({ error: result.error.message || 'Graph API error' }, { status: 400 });
    }

    const callId = result.calls?.[0]?.id;
    return NextResponse.json({ status: 'ok', callId });
  } catch (error) {
    console.error('Failed to connect call:', error);
    return NextResponse.json({ error: 'Failed to connect call' }, { status: 500 });
  }
});
