// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Phone, PhoneIncoming, PhoneOutgoing } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CallEventType, CallDirection } from '@/app/types/calling';

export type TextMessage = {
  type: 'text';
  text: string;
  direction: 'incoming' | 'outgoing';
  timestamp: number;
};

export type CallEventMessage = {
  type: 'call_event';
  event: CallEventType;
  direction?: CallDirection;
  duration?: number;
  timestamp: number;
};

export type Message = TextMessage | CallEventMessage;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getCallLabel(event: CallEventType, direction?: CallDirection): string {
  if (event === 'started') return direction === 'inbound' ? 'Incoming voice call' : 'Outgoing voice call';
  if (event === 'ended') return direction === 'inbound' ? 'Incoming call' : 'Outgoing call';
  if (event === 'missed') return 'Missed call';
  if (event === 'declined') return 'Call declined';
  return 'Call failed';
}

function CallIcon({ event, direction }: { event: CallEventType; direction?: CallDirection }) {
  if (event === 'missed' || event === 'declined' || event === 'failed') {
    return <Phone className="w-3 h-3" />;
  }
  if (direction === 'inbound') return <PhoneIncoming className="w-3 h-3" />;
  if (direction === 'outbound') return <PhoneOutgoing className="w-3 h-3" />;
  return <Phone className="w-3 h-3" />;
}

function isErrorEvent(event: CallEventType): boolean {
  return event === 'missed' || event === 'declined' || event === 'failed';
}

export default function MessageBubble(props: Message) {
  if (props.type === 'call_event') {
    const label = getCallLabel(props.event, props.direction);
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
          <CallIcon event={props.event} direction={props.direction} />
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
