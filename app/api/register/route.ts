// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { type NextRequest, NextResponse } from 'next/server';
import { registerNumber, getTokenForWaba } from '@/app/api/beUtils';
import { withAuth } from '@/app/api/authWrapper';

export const POST = withAuth(async function registerPhone(request: NextRequest, session) {
  try {
    const body = await request.json();
    const { wabaId, phoneId } = body;

    if (!wabaId || typeof wabaId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid wabaId' }, { status: 400 });
    }
    if (!phoneId || typeof phoneId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid phoneId' }, { status: 400 });
    }

    const accessToken = await getTokenForWaba(wabaId, session.user.email);
    await registerNumber(phoneId, accessToken);
    return NextResponse.json({ status: 'ok' });
  } catch (err: unknown) {
    console.error('register error:', err);
    const { code, message, status } = mapGraphApiError(err);
    return NextResponse.json({ error: true, code, message }, { status });
  }
});

function mapGraphApiError(err: unknown): { code: string; message: string; status: number } {
  const e = err as Record<string, unknown>;
  const apiCode = e?.code;
  const apiSubcode = e?.error_subcode;

  if (apiCode === 100) {
    return { code: 'INVALID_PARAMS', message: 'Invalid parameters provided.', status: 400 };
  }
  if (apiCode === 4 || apiSubcode === 2388093) {
    return { code: 'RATE_LIMITED', message: 'Too many requests. Please wait and try again.', status: 429 };
  }
  return { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred. Please try again.', status: 500 };
}
