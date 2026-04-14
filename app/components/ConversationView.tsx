// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use client';

import { useEffect, useRef } from 'react';

import { Phone } from 'lucide-react';
import MessageBubble, { type Message } from '@/app/components/MessageBubble';
import SendMessage from '@/app/components/SendMessage';

interface ConversationViewProps {
  chatId: string;
  displayName: string;
  messages: Message[];
  onSendMessage: (text: string) => void;
  phoneDisplay: string;
  isAckBotEnabled: boolean;
  onToggleAckBot: () => void;
  onCallClick?: () => void;
  callActive?: boolean;
}

export type { Message };

export default function ConversationView({
  displayName,
  messages,
  onSendMessage,
  onCallClick,
  callActive,
}: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Conversation header */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
          {displayName.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">{displayName}</div>
          <div className="text-xs text-gray-400">WhatsApp</div>
        </div>
        {onCallClick && (
          <button
            onClick={onCallClick}
            disabled={callActive}
            className="ml-auto p-2 rounded-full hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title={callActive ? 'Call in progress' : 'Start call'}
          >
            <Phone className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-0.5 bg-gradient-to-b from-[#f8f9ff] to-[#f1f3f9]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Messages from {displayName} will appear here</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble key={i} {...msg} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex-shrink-0">
        <SendMessage sendHandler={onSendMessage} />
      </div>
    </div>
  );
}
