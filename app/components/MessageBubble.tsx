// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

"use client";

interface MessageBubbleProps {
    text: string;
    direction: "incoming" | "outgoing";
    timestamp: number;
}

export default function MessageBubble({ text, direction, timestamp }: MessageBubbleProps) {
    const isIncoming = direction === "incoming";

    const formattedTime = new Date(timestamp).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    });

    return (
        <div className={`flex flex-col ${isIncoming ? "items-start" : "items-end"}`}>
            <div
                className={`px-3 py-2 rounded-lg max-w-[70%] text-sm ${
                    isIncoming
                        ? "bg-gray-100 text-gray-800 mr-auto rounded-tl-none"
                        : "bg-blue-500 text-white ml-auto rounded-tr-none"
                }`}
            >
                {text}
            </div>
            <span className="text-xs text-gray-400 mt-1">{formattedTime}</span>
        </div>
    );
}
