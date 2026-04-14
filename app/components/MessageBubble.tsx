// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CallEventType } from '@/app/types/calling';

export type TextMessage = {
  type: 'text';
  text: string;
  direction: 'incoming' | 'outgoing';
  timestamp: number;
};

export type CallEventMessage = {
  type: 'call_event';
  event: CallEventType;
  duration?: number;
  timestamp: number;
};

export type Message = TextMessage | CallEventMessage;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const CALL_EVENT_LABELS: Record<CallEventType, string> = {
  started: 'Voice call started',
  ended: 'Voice call',
  missed: 'Missed call',
  declined: 'Call declined',
  failed: 'Call failed',
};

function isErrorEvent(event: CallEventType): boolean {
  return event === 'missed' || event === 'declined' || event === 'failed';
}

export default function MessageBubble(props: Message) {
  if (props.type === 'call_event') {
    const label = CALL_EVENT_LABELS[props.event];
    const durationStr = props.event === 'ended' && props.duration != null
      ? ` \u00B7 ${formatDuration(props.duration)}`
      : '';

    const formattedTime = new Date(props.timestamp).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });

    return (
      <div className="flex justify-center my-2">
        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs',
          isErrorEvent(props.event)
            ? 'bg-red-50 text-red-600'
            : 'bg-gray-100 text-gray-500',
        )}>
          <Phone className="w-3 h-3" />
          <span className="font-medium">{label}{durationStr}</span>
          <span className="text-[10px] opacity-70">{formattedTime}</span>
        </div>
      </div>
    );
  }

  // Text message (existing behavior)
  const isIncoming = props.direction === 'incoming';
  const formattedTime = new Date(props.timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className={cn('flex mb-1', isIncoming ? 'justify-start' : 'justify-end')}>
      <div className={cn('flex flex-col max-w-[72%]', isIncoming ? 'items-start' : 'items-end')}>
        <div
          className={cn(
            'px-3.5 py-2 rounded-2xl text-sm leading-relaxed shadow-sm',
            isIncoming
              ? 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
              : 'bg-indigo-600 text-white rounded-tr-sm',
          )}
        >
          {props.text}
        </div>
        <span className="text-[10px] text-gray-400 mt-1 px-1">{formattedTime}</span>
      </div>
    </div>
  );
}
