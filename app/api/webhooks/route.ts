// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {NextResponse, type NextRequest} from 'next/server';
import Ably from 'ably';
import {
  getAckBotStatus,
  getAckBotMessage,
  send,
} from '@/app/api/beUtils';
import privateConfig from '@/app/privateConfig';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

const {fb_verify_token} = await privateConfig();

export async function GET(request: NextRequest) {
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

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    // Connect to Ably with your API key
    const { ably_key } = await privateConfig();
    const ably = new Ably.Realtime({key: ably_key, clientId: 'webhook_server'});

    await ably.connection.once('connected');
    const channel = ably.channels.get('get-started');
    await channel.publish('first', data);
    ably.connection.close();

    if (
      data.object === 'whatsapp_business_account' &&
      data.entry &&
      data.entry[0].changes &&
      data.entry[0].changes[0] &&
      data.entry[0].changes[0].value.messages &&
      data.entry[0].changes[0].value.messages[0] &&
      data.entry[0].changes[0].value.messages[0].type === 'text' &&
      data.entry[0].changes[0].value.messages[0].text
    ) {
      const waba_id = data.entry[0].id;
      // Webhook handler is server-to-server, so we query without user_id scoping
      const { rows }: { rows: { access_token: string }[] } = await sql`SELECT access_token FROM wabas WHERE waba_id = ${waba_id}`;
      const access_token = rows[0]?.access_token;

      if (access_token) {
        const recipient = data.entry[0].changes[0].value.messages[0].from;
        const msg_body = data.entry[0].changes[0].value.messages[0].text.body;
        const phone_number_id =
          data.entry[0].changes[0].value.metadata.phone_number_id;
        const isAckBotEnabled = await getAckBotStatus(phone_number_id);
        if (isAckBotEnabled) {
          // Get custom auto-reply message, fall back to echoing the received message
          const customMessage = await getAckBotMessage(phone_number_id);
          const ackText = customMessage || ('ack: ' + msg_body);

          await send(phone_number_id, access_token, recipient, ackText);

          // Publish the ack message to Ably so it appears in the inbox in real-time
          const ackTimestamp = Date.now();
          const ably2 = new Ably.Realtime({key: ably_key, clientId: 'webhook_ackbot'});
          await ably2.connection.once('connected');
          const ackChannel = ably2.channels.get('get-started');
          await ackChannel.publish('first', {
            object: 'whatsapp_business_account',
            entry: [{
              id: waba_id,
              changes: [{
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { phone_number_id },
                  messages: [{
                    from: '_ackbot_',
                    type: 'text',
                    text: { body: ackText },
                    timestamp: Math.floor(ackTimestamp / 1000),
                    _ackbot_recipient: recipient,
                  }],
                },
                field: 'messages',
              }],
            }],
          });
          ably2.connection.close();
        }
      }
    }
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
