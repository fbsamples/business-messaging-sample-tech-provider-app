// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use client';

import { feGraphApiPostWrapper } from '@/app/feUtils';
import { useState, useEffect } from 'react';
import type { PhoneDetails } from '@/app/types/api';

export default function AckBotStatus({ phone }: { phone: PhoneDetails }) {
  const [isAckBotEnabled, setIsAckBotEnabled] = useState(phone.isAckBotEnabled);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [ackMessage, setAckMessage] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  // Load saved message when modal opens
  useEffect(() => {
    if (showModal) {
      fetch(`/api/phones/${phone.id}?phoneId=${phone.id}`)
        .then((res) => res.json())
        .then((data) => {
          const msg = data.ackBotMessage || '';
          setAckMessage(msg);
        })
        .catch((err) => console.error('Failed to load ackbot message:', err));
    }
  }, [showModal, phone.id]);

  function handleToggle() {
    if (isAckBotEnabled) {
      // Disabling — just turn off, no modal needed
      setIsLoading(true);
      feGraphApiPostWrapper(`/api/phones/${phone.id}`, {
        isAckBotEnabled: false,
        phoneId: phone.id,
      })
        .then(() => setIsAckBotEnabled(false))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      // Enabling — show modal to configure message
      setShowModal(true);
    }
  }

  function handleSave() {
    setIsLoading(true);
    feGraphApiPostWrapper(`/api/phones/${phone.id}`, {
      isAckBotEnabled: true,
      phoneId: phone.id,
      ackBotMessage: ackMessage,
    })
      .then(() => {
        setIsAckBotEnabled(true);
        setShowModal(false);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }

  function handleEditMessage() {
    setShowModal(true);
  }

  function handleUpdateMessage() {
    setIsLoading(true);
    feGraphApiPostWrapper(`/api/phones/${phone.id}`, {
      isAckBotEnabled: true,
      phoneId: phone.id,
      ackBotMessage: ackMessage,
    })
      .then(() => {
        setShowModal(false);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }

  const statusColor = isAckBotEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600';

  return (
    <>
      <div className="relative">
        <div
          className={`whitespace-normal text-left rounded-md px-2.5 py-1 mr-1 text-[11px] font-semibold
                        cursor-pointer transition-all duration-200 ease-in-out
                        hover:shadow-md hover:scale-105 active:scale-95
                        border border-gray-200 hover:border-gray-300
                        flex items-center justify-center
                        ${isLoading ? 'opacity-70' : 'opacity-100'}
                        ${statusColor}
                        h-7`}
          onClick={isAckBotEnabled ? handleEditMessage : handleToggle}
          onContextMenu={(e) => {
            e.preventDefault();
            handleToggle();
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          role="button"
          tabIndex={0}
        >
          {isLoading ? '...' : isAckBotEnabled ? 'AckBot On' : 'AckBot Off'}
        </div>
        {showTooltip && (
          <div className="absolute z-50 px-3 py-2 text-xs text-slate-700 bg-white border border-slate-200 rounded-xl shadow-lg whitespace-normal -top-10 left-1/2 transform -translate-x-1/2">
            {isAckBotEnabled ? 'Click to edit message, right-click to disable' : 'Click to enable AckBot'}
            <div className="absolute w-2 h-2 bg-white border-r border-b border-slate-200 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
          </div>
        )}
      </div>

      {/* AckBot Configuration Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => setShowModal(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {isAckBotEnabled ? 'Edit AckBot Message' : 'Enable AckBot'}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {isAckBotEnabled
                ? 'Update the auto-reply message for incoming messages.'
                : 'AckBot will automatically reply to incoming messages. Set a custom message or leave empty to echo the received message.'}
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-2">Auto-reply message</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-none"
              rows={3}
              placeholder='Leave empty to echo: "ack: {received message}"'
              value={ackMessage}
              onChange={(e) => setAckMessage(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1 mb-4">
              {ackMessage ? `Will reply: "${ackMessage}"` : 'Will reply: "ack: {received message}"'}
            </p>

            <div className="flex gap-2">
              <button
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm"
                onClick={isAckBotEnabled ? handleUpdateMessage : handleSave}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : isAckBotEnabled ? 'Update' : 'Enable AckBot'}
              </button>
            </div>

            {isAckBotEnabled && (
              <button
                className="w-full mt-3 px-4 py-2 text-red-600 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors"
                onClick={() => {
                  setShowModal(false);
                  handleToggle();
                }}
                disabled={isLoading}
              >
                Disable AckBot
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
