import { type NextRequest, NextResponse } from 'next/server'
import { registerNumber, getTokenForWaba } from "../be_utils"
import { withAuth } from "../auth_wrapper";

export const POST = withAuth(async function phones(request: NextRequest, _session) {
    const body = await request.json();
    const { wabaId, phoneId } = body;
    const acesssToken = await getTokenForWaba(wabaId);
    await registerNumber(phoneId, acesssToken); // TODO: need error handling
    return new NextResponse(JSON.stringify({ response: 'ok' }));
});
