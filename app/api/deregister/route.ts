import { type NextRequest, NextResponse } from 'next/server'
import { deregisterNumber, getTokenForWaba } from "../be_utils"
import { withAuth } from "../auth_wrapper";

async function handleDeregister(request: NextRequest, _user: any) {
    const body = await request.json();
    const { wabaId, phoneId } = body;
    const acesssToken = await getTokenForWaba(wabaId);
    await deregisterNumber(phoneId, acesssToken); // TODO: need error handling
    return new NextResponse(JSON.stringify({ response: 'ok' }));
}

export const POST = withAuth(handleDeregister);
