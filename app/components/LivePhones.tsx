// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


'use client';

import Ably from 'ably';
import { useState, useEffect } from 'react';
import SendMessage from '@/app/components/SendMessage';

export default function LivePhones({ phone_display, phone_number_id, wabaId, _phone_details }) {

    const [_webhooks, setWebhooks] = useState([]);
    const [messages, setMessages] = useState({});
    const [chats, setChats] = useState({});

    function addMessage(chat_id, message) {
        setMessages((old_state) => {
            const old_chat_list = old_state[chat_id] || [];
            const new_state = { ...old_state };
            new_state[chat_id] = [message, ...old_chat_list];
            return new_state;
        });
    }

    function addChat(chat_id, displayName) {
        setChats((old_state) => {
            const new_state = { ...old_state };
            new_state[chat_id] = {
                chat_id,
                displayName
            }
            console.log('new_state');
            console.log(new_state);
            return new_state
        });
    }


    function handleKeyDownWrapper(chat_id) {
        return (message) => {
            const new_msg = '>> ' + message;
            addMessage(chat_id, new_msg);

            fetch('/api/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    waba_id: wabaId,
                    phone_number_id: phone_number_id,
                    dest_phone: chat_id,
                    message_content: message,
                }),
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Success:', data);
                })
                .catch((error) => {
                    console.error('Error:', error);
                });

        };
    }

    function addWebhook(webhook) {
        setWebhooks((old_state) => {
            return [webhook, ...old_state];
        });
    }

    useEffect(
        () => {
            console.log('useEffect run');
            const ablyClient = new Ably.Realtime({
                authCallback: async (_tokenParams, callback) => {
                    // Make a network request to your server for tokenRequest
                    fetch("/api/ably_auth")
                        .then(response => { return response.json() })
                        .then(tokenRequest => {
                            callback(null, tokenRequest)
                        })
                        .catch((error) => {
                            callback(error, null);
                        });
                }
            });

            ablyClient.connection.once("connected", () => {
                console.log("Connected to Ably!")
            })

            // Create a channel called 'get-started' and register a listener to subscribe to all messages with the name 'first'
            const channel = ablyClient.channels.get("get-started")
            channel.subscribe("first", (message) => {
                console.log("Message received: ");
                console.log(JSON.stringify(message.data, null, 2));
                const text = message.data.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;




                if (text) {
                    const dest_phone_id = message.data.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
                    const consumer_phone_number = message.data.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
                    const displayName = message.data.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name;
                    console.log('dest_phone_id');
                    console.log(dest_phone_id);
                    if (dest_phone_id === phone_number_id) {
                        addWebhook(text);
                        addChat(consumer_phone_number, displayName);
                        addMessage(consumer_phone_number, '<< ' + text);
                    }
                }

                const echo = message.data.entry?.[0]?.changes?.[0]?.value?.message_echoes?.[0]?.text?.body;
                const consumer_phone_num = message.data.entry?.[0]?.changes?.[0]?.value?.message_echoes?.[0]?.to;
                // const smb_phone_num = message.data.entry?.[0]?.changes?.[0]?.value?.message_echoes?.[0]?.from;
                if (echo) {
                    addWebhook(text);
                    addMessage(consumer_phone_num, '>> ' + echo + ' (echo)');

                }


            });

            return function cleanup() {
                console.log('ably cleanup');
                setMessages({});
                setChats({});
                setWebhooks([]);
                ablyClient.close();
            }
        },
        [phone_number_id]);


    const chatDisplay = [];

    for (const chat_id in messages) {
        const { displayName } = chats[chat_id];
        chatDisplay.push(
            <div key={chat_id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h4 className="font-medium text-gray-900">{displayName || 'Unknown Contact'}</h4>
                        <p className="text-sm text-gray-500">{chat_id}</p>
                    </div>
                    <div className="text-xs text-gray-400">
                        {new Date().toLocaleDateString()}
                    </div>
                </div>

                <div className="mb-4">
                    <SendMessage sendHandler={handleKeyDownWrapper(chat_id)} />
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {messages[chat_id].map((message, index) => {
                        const messageClass = message.startsWith('>>')
                            ? 'bg-blue-100 text-blue-800 ml-4'
                            : 'bg-gray-100 text-gray-800 mr-4';

                        return (
                            <div key={index} className={'p-2 rounded-lg text-sm ' + messageClass}>
                                {message}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };


    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 animate-pulse"></div>
                    <span className="text-blue-800 font-medium">
                        Listening for incoming messages on {phone_display}
                    </span>
                </div>
            </div>

            {chatDisplay.length > 0 ? (
                <div className="space-y-4">
                    {chatDisplay}
                </div>
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
