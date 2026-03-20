// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { type NextRequest, NextResponse } from 'next/server'
import { getTokenForWaba, verifyCode } from "../be_utils"
import { withAuth } from "../auth_wrapper";

export const POST = withAuth(async function verifyCodeEndpoint(request: NextRequest, _session) {
    try {
        const body = await request.json();
        const { wabaId, phoneId, otpCode } = body;
        const accessToken = await getTokenForWaba(wabaId);
        const data = await verifyCode(phoneId, accessToken, otpCode);
        if (data.error) {
            throw data.error;
        }
        return NextResponse.json({ response: 'ok' });
    } catch (err: any) {
        console.error('verify_code error:', err);
        const { code, message, status } = mapGraphApiError(err);
        return NextResponse.json(
            { error: true, code, message },
            { status },
        );
    }
});

function mapGraphApiError(err: any): { code: string; message: string; status: number } {
    const apiCode = err?.code;
    const apiSubcode = err?.error_subcode;

    if (apiSubcode === 136025 || (err?.message && /expired|invalid.*otp/i.test(err.message))) {
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
