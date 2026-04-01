// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


import { type NextRequest, NextResponse } from 'next/server'
import { getTokenForWaba, verifyCode } from "../be_utils"
import { withAuth } from "../auth_wrapper";

export const POST = withAuth(async function verifyCodeEndpoint(request: NextRequest, session) {
    const body = await request.json();
    const { wabaId, phoneId, otpCode } = body;
    const accessToken = await getTokenForWaba(wabaId, session.user.email);
    await verifyCode(phoneId, accessToken, otpCode);
    return new NextResponse('{"register":"ok"}');
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
