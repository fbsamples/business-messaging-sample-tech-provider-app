import { type NextRequest, NextResponse } from 'next/server'
import { getTokenForWaba, verifyCode } from "../be_utils"
import { withAuth } from "../auth_wrapper";

export const POST = withAuth(async function verifyCodeEndpoint(request: NextRequest, _session) {
    const body = await request.json();
    const { wabaId, phoneId, otpCode } = body;
    const accessToken = await getTokenForWaba(wabaId);
    await verifyCode(phoneId, accessToken, otpCode);
    return new NextResponse('{"register":"ok"}');
});
