// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use client';

import { useState, useEffect } from 'react';

import { feGraphApiPostWrapper } from '@/app/feUtils';
import type { PhoneDetails } from '@/app/types/api';
import { cn } from '@/lib/utils';

interface CallingStatusProps {
  phone: PhoneDetails;
  onCallingStatusChange?: (enabled: boolean) => void;
}

export default function CallingStatus({ phone, onCallingStatusChange }: CallingStatusProps) {
  const [isCallingEnabled, setIsCallingEnabled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Fetch current calling settings on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/calls/settings?phoneNumberId=${phone.id}&wabaId=${phone.wabaId}`,
        );
        const data = await res.json();
        const enabled = data.calling?.status === 'ENABLED';
        setIsCallingEnabled(enabled);
        onCallingStatusChange?.(enabled);
      } catch (err) {
        console.error('Failed to fetch call settings:', err);
        setIsCallingEnabled(false);
        onCallingStatusChange?.(false);
      }
    })();
  }, [phone.id, phone.wabaId, onCallingStatusChange]);

  async function handleToggle() {
    if (isCallingEnabled === null) return;

    const newState = !isCallingEnabled;
    setIsLoading(true);
    try {
      await feGraphApiPostWrapper('/api/calls/settings', {
        phoneNumberId: phone.id,
        wabaId: phone.wabaId,
        enabled: newState,
      });
      setIsCallingEnabled(newState);
      onCallingStatusChange?.(newState);
    } catch (err) {
      console.error('Failed to toggle calling:', err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isCallingEnabled === null) return null;

  const statusColor = isCallingEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600';

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={cn(
          'whitespace-normal text-left rounded-md px-2.5 py-1 mr-1 text-[11px] font-semibold',
          'cursor-pointer transition-all duration-200 ease-in-out',
          'hover:shadow-md hover:scale-105 active:scale-95',
          'border border-gray-200 hover:border-gray-300',
          'flex items-center justify-center',
          isLoading ? 'opacity-70' : 'opacity-100',
          statusColor,
          'h-7',
        )}
        onClick={handleToggle}
        role="button"
        tabIndex={0}
      >
        {isLoading ? '...' : isCallingEnabled ? 'Calling On' : 'Calling Off'}
      </div>
      {showTooltip && (
        <div className="absolute z-50 px-3 py-2 text-xs text-slate-700 bg-white border border-slate-200 rounded-xl shadow-lg whitespace-normal bottom-full mb-2 left-1/2 transform -translate-x-1/2 pointer-events-none">
          {isCallingEnabled ? 'Click to disable calling' : 'Click to enable calling'}
          <div className="absolute w-2 h-2 bg-white border-r border-b border-slate-200 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
        </div>
      )}
    </div>
  );
}
