// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use client';

import { useState, useEffect } from 'react';

import Ably from 'ably';

import SendMessage from '@/app/components/SendMessage';
import { cn } from '@/lib/utils';

interface LivePhonesProps {
  phoneDisplay: string;
  phoneNumberId: string;
  wabaId: string;
}

export default function LivePhones({ phoneDisplay, phoneNumberId, wabaId }: LivePhonesProps) {
  const [, setWebhooks] = useState<string[]>([]);
  const [messages, setMessages] = useState<Record<string, string[]>>({});
  const [chats, setChats] = useState<Record<string, { chatId: string; displayName: string }>>({});

  function addMessage(chatId: string, message: string) {
    setMessages((oldState) => {
      const oldChatList = oldState[chatId] || [];
      const newState = { ...oldState };
      newState[chatId] = [message, ...oldChatList];
      return newState;
    });
  }

  function addChat(chatId: string, displayName: string) {
    setChats((oldState) => {
      const newState = { ...oldState };
      newState[chatId] = {
        chatId,
        displayName,
      };
      return newState;
    });
  }

  function handleKeyDownWrapper(chatId: string) {
    return async (message: string) => {
      const newMsg = '>> ' + message;
      addMessage(chatId, newMsg);

      try {
        const response = await fetch('/api/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            waba_id: wabaId,
            phone_number_id: phoneNumberId,
            dest_phone: chatId,
            message_content: message,
          }),
        });
        const data = await response.json();
        if (data.error) {
          console.error('Send message failed:', data.error);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    };
  }

  function addWebhook(webhook: string) {
    setWebhooks((oldState) => {
      return [webhook, ...oldState];
    });
  }

  useEffect(() => {
    const ablyClient = new Ably.Realtime({
      authCallback: async (_, callback) => {
        try {
          const response = await fetch('/api/ably-auth');
          const tokenRequest = await response.json();
          callback(null, tokenRequest);
        } catch (error) {
          callback(error, null);
        }
      },
    });

    // Create a channel called 'get-started' and register a listener to subscribe to all messages with the name 'first'
    const channel = ablyClient.channels.get('get-started');
    channel.subscribe('first', (message) => {
      const text = message.data.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;

      if (text) {
        const destPhoneId = message.data.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
        const consumerPhoneNumber = message.data.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
        const displayName = message.data.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name;
        if (destPhoneId === phoneNumberId) {
          addWebhook(text);
          addChat(consumerPhoneNumber, displayName);
          addMessage(consumerPhoneNumber, '<< ' + text);
        }
      }

      const echo = message.data.entry?.[0]?.changes?.[0]?.value?.message_echoes?.[0]?.text?.body;
      const consumerPhoneNum = message.data.entry?.[0]?.changes?.[0]?.value?.message_echoes?.[0]?.to;
      if (echo) {
        addWebhook(text);
        addMessage(consumerPhoneNum, '>> ' + echo + ' (echo)');
      }
    });

    return function cleanup() {
      setMessages({});
      setChats({});
      setWebhooks([]);
      ablyClient.close();
    };
  }, [phoneNumberId]);

  const chatDisplay = [];

  for (const chatId in messages) {
    const { displayName } = chats[chatId];
    chatDisplay.push(
      <div key={chatId} className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-medium text-gray-900">{displayName || 'Unknown Contact'}</h4>
            <p className="text-sm text-gray-500">{chatId}</p>
          </div>
          <div className="text-xs text-gray-400">{new Date().toLocaleDateString()}</div>
        </div>

        <div className="mb-4">
          <SendMessage sendHandler={handleKeyDownWrapper(chatId)} />
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {messages[chatId].map((message, index) => {
            const messageClass = message.startsWith('>>')
              ? 'bg-blue-100 text-blue-800 ml-4'
              : 'bg-gray-100 text-gray-800 mr-4';

            return (
              <div key={index} className={cn('p-2 rounded-lg text-sm', messageClass)}>
                {message}
              </div>
            );
          })}
        </div>
      </div>,
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 animate-pulse"></div>
          <span className="text-blue-800 font-medium">Listening for incoming messages on {phoneDisplay}</span>
        </div>
      </div>

      {chatDisplay.length > 0 ? (
        <div className="space-y-4">{chatDisplay}</div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-3">💬</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Messages Yet</h3>
          <p className="text-gray-500">Messages will appear here when customers start conversations</p>
        </div>
      )}
    </div>
  );
}
