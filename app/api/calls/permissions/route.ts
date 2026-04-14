// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { type NextRequest, NextResponse } from 'next/server';

import { graphApiCallPermissionsGet } from '@/app/api/beUtils';
import { withAuth } from '@/app/api/authWrapper';

export const GET = withAuth(async function getCallPermissions(request: NextRequest, session) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumberId = searchParams.get('phoneNumberId');
    const wabaId = searchParams.get('wabaId');
    const userWaId = searchParams.get('userWaId');

    if (!phoneNumberId || !wabaId || !userWaId) {
      return NextResponse.json({ error: 'Missing required query params' }, { status: 400 });
    }

    const result = await graphApiCallPermissionsGet(
      session.user.email!,
      wabaId,
      phoneNumberId,
      userWaId,
    );

    if (result.error) {
      console.error('Graph API permissions error:', result.error);
      return NextResponse.json({ error: result.error.message || 'Graph API error' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to check call permissions:', error);
    return NextResponse.json({ error: 'Failed to check call permissions' }, { status: 500 });
  }
});
