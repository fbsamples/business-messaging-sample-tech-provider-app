// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

"use client";

import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import SendMessage from "./SendMessage";

export type Message = {
    text: string;
    direction: "incoming" | "outgoing";
    timestamp: number;
};

interface ConversationViewProps {
    chatId: string;
    displayName: string;
    messages: Message[];
    onSendMessage: (text: string) => void;
    phoneDisplay: string;
    isAckBotEnabled: boolean;
    onToggleAckBot: () => void;
}

export default function ConversationView({
    chatId: _chatId,
    displayName: _displayName,
    messages,
    onSendMessage,
}: ConversationViewProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex-1 flex flex-col">
            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <svg className="mx-auto mb-4 w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-gray-400 text-sm">Messages will appear here when customers start conversations</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, index) => (
                            <MessageBubble
                                key={index}
                                text={msg.text}
                                direction={msg.direction}
                                timestamp={msg.timestamp}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
                <SendMessage sendHandler={onSendMessage} />
            </div>
        </div>
    );
}
