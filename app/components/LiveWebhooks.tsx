// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


'use client';

import Ably from 'ably';
import { useState, useEffect } from 'react';

interface WebhookEntry {
    field: string;
    receivedAt: string;
    status: number;
    payload: unknown;
}

function extractField(data: unknown): string {
    try {
        const d = data as { entry?: { changes?: { field?: string }[] }[] };
        return d?.entry?.[0]?.changes?.[0]?.field || 'Unknown';
    } catch {
        return 'Unknown';
    }
}

function formatTimestamp(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function LiveWebhooks() {

    const [webhooks, setWebhooks] = useState<WebhookEntry[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    function addWebhook(data: unknown) {
        const entry: WebhookEntry = {
            field: extractField(data),
            receivedAt: formatTimestamp(new Date()),
            status: 200,
            payload: data,
        };
        setWebhooks((old_state) => {
            return [entry, ...old_state];
        });
    }

    useEffect(
        () => {
            setIsMounted(true);
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

            ablyClient.connection.on("connected", () => {
                console.log("Connected to Ably!")
            })

            // Create a channel called 'get-started' and register a listener to subscribe to all messages with the name 'first'
            const channel = ablyClient.channels.get("get-started")
            channel.subscribe("first", (message) => {
                console.log("Message received: ");
                addWebhook(message.data);
            });

            return function cleanup() {
                console.log('ably cleanup');
                ablyClient.close();
            }
        },
        []);


    if (!isMounted) {
        return null;
    }

    if (webhooks.length === 0) {
        return (
            <p className="text-sm text-gray-500">Listening for webhook events...</p>
        );
    }

    return (
        <div className="space-y-4">
            {webhooks.map((webhook, index) => (
                <div key={index} className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="px-5 py-3 border-b border-gray-200">
                        <div className="text-sm font-semibold text-gray-900">
                            Field: {webhook.field.charAt(0).toUpperCase() + webhook.field.slice(1)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <span>{webhook.receivedAt}</span>
                            <span>•</span>
                            <span>Status: {webhook.status}</span>
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="text-sm font-semibold text-gray-900 mb-2">Payload:</div>
                        <div className="bg-gray-100 rounded-md p-4 overflow-y-auto max-h-[200px]">
                            <pre className="font-mono text-xs text-gray-800 whitespace-pre">
                                {JSON.stringify(webhook.payload, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
