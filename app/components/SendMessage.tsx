// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


'use client';

import { useState } from 'react';

export default function SendMessage({ sendHandler }) {

    const [currentMessageText, setCurrentMessageText] = useState('');

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            setCurrentMessageText('');
            sendHandler(event.target.value);
        }
    };

    const handleChange = (event) => {
        setCurrentMessageText(event.target.value);
    };

    return (
        <div className="flex items-center space-x-2">
            <input
                value={currentMessageText}
                placeholder="Type your message here..."
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm transition duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
            />
            <button
                onClick={() => {
                    if (currentMessageText.trim()) {
                        sendHandler(currentMessageText);
                        setCurrentMessageText('');
                    }
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!currentMessageText.trim()}
            >
                Send
            </button>
        </div>
    );
}
