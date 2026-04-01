// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { type NextRequest, NextResponse } from 'next/server'
import { getTokenForWaba, verifyCode } from "@/app/api/beUtils"
import { withAuth } from "@/app/api/authWrapper";

export const POST = withAuth(async function verifyCodeEndpoint(request: NextRequest, session) {
    try {
        const body = await request.json();
        const { wabaId, phoneId, otpCode } = body;

        if (!wabaId || typeof wabaId !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid wabaId' }, { status: 400 });
        }
        if (!phoneId || typeof phoneId !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid phoneId' }, { status: 400 });
        }
        if (!otpCode || typeof otpCode !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid otpCode' }, { status: 400 });
        }

        const accessToken = await getTokenForWaba(wabaId, session.user.email);
        await verifyCode(phoneId, accessToken, otpCode);
        return NextResponse.json({ status: 'ok' });
    } catch (err: unknown) {
        console.error('verify_code error:', err);
        const { code, message, status } = mapGraphApiError(err);
        return NextResponse.json(
            { error: true, code, message },
            { status },
        );
    }
});

function mapGraphApiError(err: unknown): { code: string; message: string; status: number } {
    const e = err as Record<string, unknown>;
    const apiCode = e?.code;
    const apiSubcode = e?.error_subcode;

    if (apiSubcode === 136025 || (typeof e?.message === 'string' && /expired|invalid.*otp/i.test(e.message))) {
        return { code: 'OTP_EXPIRED', message: 'Verification code has expired. Please request a new one.', status: 400 };
    }
    if (apiCode === 100) {
        return { code: 'INVALID_CODE', message: 'Invalid verification code.', status: 400 };
    }
    if (apiCode === 4 || apiSubcode === 2388093) {
        return { code: 'RATE_LIMITED', message: 'Too many requests. Please wait and try again.', status: 429 };
    }
    return { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred. Please try again.', status: 500 };
}
