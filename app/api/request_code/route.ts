import { type NextRequest, NextResponse } from 'next/server'
import { getTokenForWaba, requestCode } from "../be_utils"
import { withAuth } from "../auth_wrapper";

export const POST = withAuth(async function requestCodeEndpoint(request: NextRequest, _session) {
    const body = await request.json();
    const waba_id = body.waba_id;
    const accessToken = await getTokenForWaba(waba_id);
    const phoneNumberId = body.phone_number_id;
    await requestCode(phoneNumberId, accessToken);
    return new NextResponse('{"register":"ok"}');
});