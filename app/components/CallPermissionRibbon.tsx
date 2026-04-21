// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use client';

import { useState, useEffect } from 'react';

import { Loader2, ShieldCheck, ShieldX, PhoneOutgoing, Clock } from 'lucide-react';
import type { PermissionState } from '@/app/types/calling';
import { cn } from '@/lib/utils';
import { formatTimeRemaining } from '@/app/utils/calling';

interface CallPermissionRibbonProps {
  permissionState: PermissionState;
  expirationTime?: number;
  remainingRequests?: string;
  onRequestPermission: () => void;
}

export default function CallPermissionRibbon({
  permissionState,
  expirationTime,
  remainingRequests,
  onRequestPermission,
}: CallPermissionRibbonProps) {
  const [timeRemaining, setTimeRemaining] = useState(
    expirationTime ? formatTimeRemaining(expirationTime) : '',
  );

  // Live countdown for temporary permissions
  useEffect(() => {
    if (!expirationTime) return undefined;
    setTimeRemaining(formatTimeRemaining(expirationTime));
    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(expirationTime));
    }, 30000);
    return () => clearInterval(interval);
  }, [expirationTime]);

  if (permissionState === 'none') return null;

  return (
    <div
      aria-live="polite"
      className={cn(
        'px-4 py-2 flex items-center justify-between border-b text-xs transition-all',
        permissionState === 'checking' && 'bg-blue-50 border-blue-200',
        permissionState === 'requesting' && 'bg-amber-50 border-amber-200',
        permissionState === 'pending' && 'bg-blue-50 border-blue-200',
        permissionState === 'granted' && 'bg-green-50 border-green-200',
        permissionState === 'denied' && 'bg-red-50 border-red-200',
        permissionState === 'rate_limited' && 'bg-orange-50 border-orange-200',
      )}
    >
      <div className="flex items-center gap-2">
        {permissionState === 'checking' && (
          <>
            <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            <span className="font-medium text-blue-800">Checking call permissions...</span>
          </>
        )}
        {permissionState === 'requesting' && (
          <>
            <PhoneOutgoing className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-medium text-amber-800">
              Call permission required
              {remainingRequests && (
                <span className="font-normal text-amber-600 ml-1">· {remainingRequests}</span>
              )}
            </span>
          </>
        )}
        {permissionState === 'pending' && (
          <>
            <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            <span className="font-medium text-blue-800">
              Permission request sent — waiting for response
              {remainingRequests && (
                <span className="font-normal text-blue-600 ml-1">· {remainingRequests}</span>
              )}
            </span>
          </>
        )}
        {permissionState === 'granted' && (
          <>
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            <span className="font-medium text-green-800">
              Permission granted
              {expirationTime && timeRemaining !== 'expired' && (
                <span className="inline-flex items-center gap-1 ml-2 text-green-600 font-normal">
                  <Clock className="w-3 h-3" />
                  expires in {timeRemaining}
                </span>
              )}
            </span>
          </>
        )}
        {permissionState === 'denied' && (
          <>
            <ShieldX className="w-3.5 h-3.5 text-red-500" />
            <span className="font-medium text-red-600">Permission declined</span>
          </>
        )}
        {permissionState === 'rate_limited' && (
          <>
            <ShieldX className="w-3.5 h-3.5 text-orange-600" />
            <span className="font-medium text-orange-700">Call permission request limit reached — try again later</span>
          </>
        )}
      </div>

      {(permissionState === 'requesting' || permissionState === 'denied') && (
        <button
          onClick={onRequestPermission}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors flex-shrink-0"
        >
          {permissionState === 'denied' ? 'Request Again' : 'Request Permission'}
        </button>
      )}
    </div>
  );
}
