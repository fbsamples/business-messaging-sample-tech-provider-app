// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export const dynamic = 'force-dynamic'; // static by default, unless reading the request
import {NextResponse, type NextRequest} from 'next/server';
import Ably from 'ably';
import {
  getAckBotStatus,
  getAckBotMessage,
  getTokenForWaba,
  send,
} from '@/app/api/be_utils';
import privateConfig from '@/app/private_config';
import publicConfig from '@/app/public_config';
import { sql } from '@vercel/postgres';

const {fb_verify_token} = await privateConfig();

export async function GET(request: NextRequest) {
  console.log('/webhooks get');

  const mode = request.nextUrl.searchParams.get('hub.mode') || '';
  const verify_token =
    request.nextUrl.searchParams.get('hub.verify_token') || '';
  const challenge = request.nextUrl.searchParams.get('hub.challenge') || '';

    if (mode === 'subscribe' && verify_token === fb_verify_token) {
        return new NextResponse(challenge);
    } else {
        return NextResponse.json({ status: 'ok' });
    }
}

  if (mode === 'subscribe' && verify_token === fb_verify_token) {
    return new NextResponse(challenge);
  } else {
    const response = new NextResponse(JSON.stringify('ok'), {status: 200});
    return response;
  }
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        // Publish to Ably for real-time UI updates
        const ably = new Ably.Realtime({ key: process.env.ABLY_KEY, clientId: "webhook_server" });
        await ably.connection.once('connected');
        const channel = ably.channels.get("get-started");
        await channel.publish("first", data);
        ably.connection.close();

        if (data.object === "whatsapp_business_account"
            && data.entry
            && data.entry[0].changes
            && data.entry[0].changes[0]
            && data.entry[0].changes[0].value.messages
            && data.entry[0].changes[0].value.messages[0]
            && data.entry[0].changes[0].value.messages[0].type === "text"
            && data.entry[0].changes[0].value.messages[0].text) {

            const waba_id = data.entry[0].id;
            // Webhook handler is server-to-server, so we query without user_id scoping
            const { rows }: { rows: { access_token: string }[] } = await sql`SELECT access_token FROM wabas WHERE waba_id = ${waba_id}`;
            const access_token = rows[0]?.access_token;

            if (access_token) {
                const recipient = data.entry[0].changes[0].value.messages[0].from;
                const msg_body = data.entry[0].changes[0].value.messages[0].text.body;
                const phone_number_id = data.entry[0].changes[0].value.metadata.phone_number_id;

                const isAckBotEnabled = await getAckBotStatus(phone_number_id);
                if (isAckBotEnabled) {
                    await fetch(
                        `https://graph.facebook.com/${publicConfig.graph_api_version}/${phone_number_id}/messages`,
                        {
                            method: 'POST',
                            body: JSON.stringify({
                                messaging_product: "whatsapp",
                                recipient_type: "individual",
                                to: recipient,
                                text: {
                                    body: "ack: " + msg_body
                                }
                            }),
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${access_token}`
                            }
                        }
                    );
                }
            }
        }
        return NextResponse.json({ status: "ok" });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
