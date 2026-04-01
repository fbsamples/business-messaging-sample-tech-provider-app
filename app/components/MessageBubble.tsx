// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  text: string;
  direction: 'incoming' | 'outgoing';
  timestamp: number;
}

export default function MessageBubble({ text, direction, timestamp }: MessageBubbleProps) {
  const isIncoming = direction === 'incoming';
  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
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
          {text}
        </div>
        <span className="text-[10px] text-gray-400 mt-1 px-1">{formattedTime}</span>
      </div>
    </div>
  );
}
