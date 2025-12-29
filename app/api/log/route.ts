// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { withAuth } from "../auth_wrapper";

export const POST = withAuth(async function logs(request, _session) {
    try {
        const { user_id, action } = await request.json();

        if (!user_id || !action) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        await sql`
      INSERT INTO logs (user_id, action, timestamp)
      VALUES (${user_id}, ${action}, CURRENT_TIMESTAMP)
    `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error logging action:', error);
        return NextResponse.json(
            { error: 'Failed to log action' },
            { status: 500 }
        );
    }
}); 