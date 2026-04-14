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

    // Publish raw webhook data for the live webhook viewer (unchanged)
    await channel.publish('first', data);
    console.log('[Webhook] Published raw data. object:', data.object, 'fields:', data.entry?.map((e: any) => e.changes?.map((c: any) => c.field)).flat());

    if (data.object === 'whatsapp_business_account') {
      for (const entry of data.entry ?? []) {
        for (const change of entry.changes ?? []) {
          const value = change.value;
          const field = change.field;

          // Handle calling webhooks
          console.log('[Webhook] field:', field);
          if (field === 'calls') {
            const metadata = value?.metadata;
            console.log('[Webhook] Processing calls webhook, events:', value?.calls?.length, 'statuses:', value?.statuses?.length);

            // Call events: connect, terminate, failed
            if (value?.calls?.length > 0) {
              const call = value.calls[0];
              console.log('[Webhook] Publishing call event:', call.event, 'callId:', call.id);
              await channel.publish('call', {
                type: 'call_event',
                event: call.event,
                phoneNumberId: metadata?.phone_number_id,
                displayPhoneNumber: metadata?.display_phone_number,
                callerNumber: call.from,
                wabaId: entry.id,
                callId: call.id,
                sdp: call.session?.sdp,
                sdpType: call.session?.sdp_type,
              });
            }

            // Call statuses: ringing, accepted, completed, failed
            if (value?.statuses?.length > 0) {
              const status = value.statuses[0];
              await channel.publish('call', {
                type: 'call_status',
                status: status.status,
                phoneNumberId: metadata?.phone_number_id,
                displayPhoneNumber: metadata?.display_phone_number,
                wabaId: entry.id,
                callId: status.id,
              });
            }
          }

          // Handle messaging webhooks (existing AckBot logic)
          if (field === 'messages' || !field) {
            const msgData = value?.messages?.[0];
            if (msgData?.type === 'text' && msgData?.text) {
              const wabaId = entry.id;
              const { rows }: { rows: { access_token: string }[] } =
                await sql`SELECT access_token FROM wabas WHERE waba_id = ${wabaId}`;
              const accessToken = rows[0]?.access_token;

              if (accessToken) {
                const recipient: string = msgData.from;
                const msgBody: string = msgData.text.body;
                const phoneNumberId: string = value.metadata.phone_number_id;

                const isAckBotEnabled = await getAckBotStatus(phoneNumberId);
                if (isAckBotEnabled) {
                  const customMessage = await getAckBotMessage(phoneNumberId);
                  const ackText = customMessage || 'ack: ' + msgBody;

                  await send(phoneNumberId, accessToken, recipient, ackText);

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
          }
        }
      }
    }

    ably.close();
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
