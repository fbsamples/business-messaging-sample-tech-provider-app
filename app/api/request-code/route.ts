// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { type NextRequest, NextResponse } from 'next/server';

import { getTokenForWaba, requestCode } from '@/app/api/beUtils';
import { withAuth } from '@/app/api/authWrapper';

export const POST = withAuth(async function requestCodeEndpoint(request: NextRequest, session) {
  try {
    const body = await request.json();
    const { waba_id: wabaId, phone_number_id: phoneNumberId } = body;

    if (!wabaId || typeof wabaId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid waba_id' }, { status: 400 });
    }
    if (!phoneNumberId || typeof phoneNumberId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid phone_number_id' }, { status: 400 });
    }

    const accessToken = await getTokenForWaba(wabaId, session.user.email);
    await requestCode(phoneNumberId, accessToken);
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Failed to request verification code:', error);
    return NextResponse.json({ error: 'Failed to request verification code' }, { status: 500 });
  }
});
