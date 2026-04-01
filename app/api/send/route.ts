// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { type NextRequest, NextResponse } from 'next/server';

import { send, getTokenForWaba } from '@/app/api/beUtils';
import { withAuth } from '@/app/api/authWrapper';

export const POST = withAuth(async function sendMessage(request: NextRequest, session) {
  try {
    const body = await request.json();
    const { waba_id: wabaId, phone_number_id: phoneNumberId, dest_phone: destPhone, message_content: messageContent } = body;

    if (!wabaId || typeof wabaId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid waba_id' }, { status: 400 });
    }
    if (!phoneNumberId || typeof phoneNumberId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid phone_number_id' }, { status: 400 });
    }
    if (!destPhone || typeof destPhone !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid dest_phone' }, { status: 400 });
    }
    if (!messageContent || typeof messageContent !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid message_content' }, { status: 400 });
    }

    const accessToken = await getTokenForWaba(wabaId, session.user.email);
    const result = await send(phoneNumberId, accessToken, destPhone, messageContent);
    return NextResponse.json({ status: 'ok', data: result });
  } catch (error) {
    console.error('Failed to send message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
});
