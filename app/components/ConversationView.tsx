// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use client';

import { useEffect, useRef } from 'react';

import { Phone, Clock, PhoneMissed } from 'lucide-react';
import MessageBubble, { type Message } from '@/app/components/MessageBubble';
import SendMessage from '@/app/components/SendMessage';
import CallPermissionRibbon from '@/app/components/CallPermissionRibbon';
import type { PermissionState } from '@/app/types/calling';
import { cn } from '@/lib/utils';

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
  permissionState?: PermissionState;
  permissionExpirationTime?: number;
  permissionRemainingRequests?: string;
  onRequestPermission?: () => void;
  hasMissedCall?: boolean;
  onCallBack?: () => void;
}

export type { Message };

export default function ConversationView({
  displayName,
  messages,
  onSendMessage,
  onCallClick,
  callActive,
  permissionState,
  permissionExpirationTime,
  permissionRemainingRequests,
  onRequestPermission,
  hasMissedCall,
  onCallBack,
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
            disabled={callActive || (!!permissionState && permissionState !== 'none' && permissionState !== 'granted')}
            className={cn(
              'ml-auto relative p-2.5 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed',
              !permissionState || permissionState === 'none' || permissionState === 'granted'
                ? 'text-green-600 hover:bg-green-50'
                : 'text-gray-400 hover:bg-gray-50',
            )}
            aria-label={
              callActive ? 'Call in progress' :
              permissionState === 'granted' && permissionExpirationTime
                ? 'Temporary permission — click to call'
                : permissionState === 'checking'
                  ? 'Checking permissions...'
                  : permissionState === 'requesting' || permissionState === 'denied' || permissionState === 'rate_limited'
                    ? 'No call permission'
                    : 'Start call'
            }
          >
            <Phone className="w-5 h-5" aria-hidden="true" />
            {permissionState === 'granted' && permissionExpirationTime && (
              <Clock className="w-2.5 h-2.5 absolute -top-0.5 -right-0.5 text-amber-500" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* Permission ribbon */}
      {permissionState && permissionState !== 'none' && onRequestPermission && (
        <CallPermissionRibbon
          permissionState={permissionState}
          expirationTime={permissionExpirationTime}
          remainingRequests={permissionRemainingRequests}
          onRequestPermission={onRequestPermission}
        />
      )}

      {/* Missed call — call back suggestion */}
      {hasMissedCall && onCallBack && !callActive && (
        <div role="alert" className="px-4 py-2 flex items-center justify-between border-b bg-red-50 border-red-200 text-xs">
          <div className="flex items-center gap-2">
            <PhoneMissed className="w-3.5 h-3.5 text-red-500" />
            <span className="font-medium text-red-700">Missed call from {displayName}</span>
          </div>
          <button
            onClick={onCallBack}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <Phone className="w-3 h-3" />
            Call back
          </button>
        </div>
      )}

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
