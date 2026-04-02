// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { NextResponse, type NextRequest } from 'next/server';

import Ably from 'ably';
import { sql } from '@vercel/postgres';

import { getAckBotStatus, getAckBotMessage, send } from '@/app/api/beUtils';
import privateConfig from '@/app/privateConfig';

export const dynamic = 'force-dynamic';

const { fbVerifyToken } = await privateConfig();

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode') || '';
  const verifyToken = request.nextUrl.searchParams.get('hub.verify_token') || '';
  const challenge = request.nextUrl.searchParams.get('hub.challenge') || '';

  if (mode === 'subscribe' && verifyToken === fbVerifyToken) {
    return new NextResponse(challenge);
  } else {
    return NextResponse.json({ status: 'ok' });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { ablyKey } = await privateConfig();

    const ably = new Ably.Realtime({ key: ablyKey, clientId: 'webhook_server' });
    await ably.connection.once('connected');
    const channel = ably.channels.get('get-started');
    await channel.publish('first', data);
    ably.close();

    // AckBot: auto-reply to incoming text messages when enabled.
    if (
      data.object === 'whatsapp_business_account' &&
      data.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.type === 'text' &&
      data.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text
    ) {
      const wabaId = data.entry[0].id;
      const { rows }: { rows: { access_token: string }[] } =
        await sql`SELECT access_token FROM wabas WHERE waba_id = ${wabaId}`;
      const accessToken = rows[0]?.access_token;

      if (accessToken) {
        const recipient: string = data.entry[0].changes[0].value.messages[0].from;
        const msgBody: string = data.entry[0].changes[0].value.messages[0].text.body;
        const phoneNumberId: string = data.entry[0].changes[0].value.metadata.phone_number_id;

        const isAckBotEnabled = await getAckBotStatus(phoneNumberId);
        if (isAckBotEnabled) {
          const customMessage = await getAckBotMessage(phoneNumberId);
          const ackText = customMessage || 'ack: ' + msgBody;

          await send(phoneNumberId, accessToken, recipient, ackText);

          // Publish the ack message to Ably so it appears in the inbox in real-time.
          const ackTimestamp = Date.now();
          const ackPayload = {
            object: 'whatsapp_business_account',
            entry: [
              {
                id: wabaId,
                changes: [
                  {
                    value: {
                      messaging_product: 'whatsapp',
                      metadata: { phone_number_id: phoneNumberId },
                      messages: [
                        {
                          from: '_ackbot_',
                          type: 'text',
                          text: { body: ackText },
                          timestamp: Math.floor(ackTimestamp / 1000),
                          _ackbot_recipient: recipient,
                        },
                      ],
                    },
                    field: 'messages',
                  },
                ],
              },
            ],
          };

          const ably2 = new Ably.Realtime({ key: ablyKey, clientId: 'webhook_ackbot' });
          await ably2.connection.once('connected');
          const ackChannel = ably2.channels.get('get-started');
          await ackChannel.publish('first', ackPayload);
          ably2.close();
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
