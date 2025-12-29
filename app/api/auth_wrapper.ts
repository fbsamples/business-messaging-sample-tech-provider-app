// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

type ApiHandler = (request: NextRequest, user: any) => Promise<NextResponse> | NextResponse;

export function withAuth(handler: ApiHandler) {
    return async (request: NextRequest): Promise<NextResponse> => {
        try {
            const session = await auth0.getSession();

            if (!session || !session.user) {
                return new NextResponse(
                    JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
                    {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            return await handler(request, session);
        } catch (error) {
            console.error('Auth wrapper error:', error);
            return new NextResponse(
                JSON.stringify({ error: 'Internal Server Error', message: 'Authentication failed' }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
    };
}
