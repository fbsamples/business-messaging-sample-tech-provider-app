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

const {fb_verify_token} = await privateConfig();

export async function GET(request: NextRequest) {
  console.log('/webhooks get');

  const mode = request.nextUrl.searchParams.get('hub.mode') || '';
  const verify_token =
    request.nextUrl.searchParams.get('hub.verify_token') || '';
  const challenge = request.nextUrl.searchParams.get('hub.challenge') || '';

  console.log(
    '/webhooks',
    'mode',
    mode,
    'verify_token',
    verify_token,
    'challenge',
    challenge,
  );

  if (mode === 'subscribe' && verify_token === fb_verify_token) {
    return new NextResponse(challenge);
  } else {
    const response = new NextResponse(JSON.stringify('ok'), {status: 200});
    return response;
  }
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  // Connect to Ably with your API key
  const ably_key = process.env.ABLY_KEY;
  const ably = new Ably.Realtime({key: ably_key, clientId: 'webhook_server'});

  await ably.connection.once('connected');
  // Create a channel called 'get-started' and register a listener to subscribe to all messages with the name 'first'
  const channel = ably.channels.get('get-started');
  // Publish a message with the name 'first' and the contents 'Here is my first message!'
  await channel.publish('first', data);
  ably.connection.close(); // run synchronously

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
    const access_token = await getTokenForWaba(waba_id);

    console.log('acking');

    const recipient = data.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
    const msg_body = data.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload
    const phone_number_id =
      data.entry[0].changes[0].value.metadata.phone_number_id; // extract the phone number id from the webhook payload
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
  return new NextResponse(JSON.stringify('ok'), {status: 200});
}
