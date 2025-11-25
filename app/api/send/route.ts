import { type NextRequest, NextResponse } from 'next/server'
import { send, getTokenForWaba } from "../be_utils"
import { withAuth } from "../auth_wrapper";

export const POST = withAuth(async function myApiRoute(request: NextRequest, _session) {
    const body = await request.json();
    const waba_id = body.waba_id;
    const access_token = await getTokenForWaba(waba_id);
    const phone_number_id = body.phone_number_id;
    const dest_phone = body.dest_phone;
    const message_content = body.message_content;
    await send(phone_number_id, access_token, dest_phone, message_content); // TODO: need error handling
    return new NextResponse('{"register":"ok"}');
});
