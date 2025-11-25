'use client';

import Ably from 'ably';
import { useState, useEffect } from 'react';
// import { NextResponse, type NextRequest } from 'next/server'


export default function LiveWebhooks() {

    const [webhooks, setWebhooks] = useState([]);
    const [isMounted, setIsMounted] = useState(false);

    function addWebhook(webhook) {
        setWebhooks((old_state) => {
            return [webhook, ...old_state];
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

            ablyClient.connection.once("connected", () => {
                console.log("Connected to Ably!")
            })

            // Create a channel called 'get-started' and register a listener to subscribe to all messages with the name 'first'
            const channel = ablyClient.channels.get("get-started")
            channel.subscribe("first", (message) => {
                console.log("Message received: ");
                // console.log(JSON.stringify(message.data, null, 2));
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

    const rows = webhooks.map((webhook, index) => {
        return (
            <div key={index}>
                <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors border-gray-300 bg-gray-100 text-xs">
                    <pre>
                        {JSON.stringify(webhook, null, 2)}
                    </pre>
                </div>
                <br />
            </div>
        )
    })

    return (
        <>
            <div className="font-mono text-xs">
                {rows}
            </div>
        </>
    );
}
