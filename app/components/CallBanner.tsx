// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use client';

import { useState, useEffect, useRef } from 'react';

import { Phone, PhoneOff, PhoneOutgoing, Mic, MicOff, Loader2 } from 'lucide-react';
import type { ActiveCallState } from '@/app/types/calling';
import type { CallingClient } from '@/app/components/CallingClient';
import { cn } from '@/lib/utils';
import { formatDuration, generateRingToneBlob } from '@/app/utils/calling';

interface CallBannerProps {
  callState: ActiveCallState;
  callingClient: CallingClient | null;
  onAccept: () => void;
  onReject: () => void;
  onHangUp: () => void;
  onRetry?: () => void;
}

let _ringAudio: HTMLAudioElement | null = null;
let _inboundUrl: string | null = null;
let _outboundUrl: string | null = null;

export function stopRinging() {
  if (_ringAudio) {
    _ringAudio.pause();
    _ringAudio.removeAttribute('src');
    _ringAudio.load();
    _ringAudio = null;
  }
}

function startRinging(type: 'inbound' | 'outbound') {
  stopRinging();
  if (type === 'inbound') {
    if (!_inboundUrl) _inboundUrl = URL.createObjectURL(generateRingToneBlob('inbound'));
    _ringAudio = new Audio(_inboundUrl);
  } else {
    if (!_outboundUrl) _outboundUrl = URL.createObjectURL(generateRingToneBlob('outbound'));
    _ringAudio = new Audio(_outboundUrl);
  }
  _ringAudio.loop = true;
  _ringAudio.play().catch(() => {});
}

export default function CallBanner({
  callState,
  callingClient,
  onAccept,
  onReject,
  onHangUp,
  onRetry,
}: CallBannerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isInbound = callState.direction === 'inbound';
  const isOutbound = callState.direction === 'outbound';

  // Ringing sound — start/stop based on call state
  useEffect(() => {
    const shouldPlayInbound = callState.state === 'RINGING' && isInbound;
    const shouldPlayOutbound = isOutbound && (callState.state === 'CONNECTING' || callState.state === 'RINGING');

    if (shouldPlayInbound) {
      startRinging('inbound');
    } else if (shouldPlayOutbound) {
      // Only start if not already playing (avoids gap on CONNECTING→RINGING)
      if (!_ringAudio) startRinging('outbound');
    } else {
      stopRinging();
    }

    return () => stopRinging();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- isInbound/isOutbound already derive from direction
  }, [callState.state, isInbound, isOutbound]);

  // Duration timer
  useEffect(() => {
    if (callState.state === 'ACTIVE') {
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState.state]);

  // Fade out on ENDED
  useEffect(() => {
    if (callState.state === 'ENDED') {
      const timeout = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timeout);
    }
    setVisible(true);
    return undefined;
  }, [callState.state]);

  // Reset mute when call ends
  useEffect(() => {
    if (callState.state !== 'ACTIVE') setIsMuted(false);
  }, [callState.state]);

  // Only show banner for active call states (permission UI moved to CallPermissionRibbon)
  if (callState.state === 'IDLE') return null;
  if (!visible) return null;

  const handleMuteToggle = () => {
    if (callingClient) {
      const muted = callingClient.toggleMute();
      setIsMuted(muted);
    }
  };

  // Call states UI
  return (
    <div
      className={cn(
        'px-4 py-3 flex items-center justify-between border-b transition-all',
        callState.state === 'RINGING' && isInbound && 'bg-green-50 border-green-200',
        callState.state === 'RINGING' && isOutbound && 'bg-blue-50 border-blue-200',
        callState.state === 'CONNECTING' && 'bg-blue-50 border-blue-200',
        callState.state === 'ACTIVE' && 'bg-emerald-50 border-emerald-200',
        callState.state === 'ENDED' && 'bg-gray-50 border-gray-200 opacity-60',
      )}
    >
      <div className="flex items-center gap-3">
        {isOutbound ? (
          <PhoneOutgoing className={cn(
            'w-4 h-4',
            (callState.state === 'CONNECTING' || callState.state === 'RINGING') && 'text-blue-600 animate-pulse',
            callState.state === 'ACTIVE' && 'text-emerald-600',
            callState.state === 'ENDED' && 'text-gray-400',
          )} />
        ) : (
          <Phone className={cn(
            'w-4 h-4',
            callState.state === 'RINGING' && 'text-green-600 animate-pulse',
            callState.state === 'CONNECTING' && 'text-blue-600',
            callState.state === 'ACTIVE' && 'text-emerald-600',
            callState.state === 'ENDED' && 'text-gray-400',
          )} />
        )}
        <div>
          {callState.state === 'RINGING' && isInbound && (
            <span className="text-sm font-medium text-green-800">
              Incoming call from {callState.callerName ?? callState.callerNumber ?? 'unknown'}
            </span>
          )}
          {callState.state === 'CONNECTING' && isOutbound && (
            <span className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Calling {callState.destPhone}...
            </span>
          )}
          {callState.state === 'RINGING' && isOutbound && (
            <span className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Ringing {callState.destPhone}...
            </span>
          )}
          {callState.state === 'CONNECTING' && isInbound && (
            <span className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Connecting...
            </span>
          )}
          {callState.state === 'ACTIVE' && (
            <span className="text-sm font-medium text-emerald-800">
              On call &middot; {formatDuration(duration)}
            </span>
          )}
          {callState.state === 'ENDED' && (
            <span className="text-sm text-gray-500">
              Call ended
              {callState.error && ` — ${callState.error}`}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {callState.state === 'RINGING' && isInbound && (
          <>
            <button
              onClick={onAccept}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              <Phone className="w-3 h-3" />
              Accept
            </button>
            <button
              onClick={onReject}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              <PhoneOff className="w-3 h-3" />
              Reject
            </button>
          </>
        )}

        {(callState.state === 'CONNECTING' || callState.state === 'RINGING') && isOutbound && (
          <button
            onClick={onHangUp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <PhoneOff className="w-3 h-3" />
            Cancel
          </button>
        )}

        {callState.state === 'ACTIVE' && (
          <>
            <button
              onClick={handleMuteToggle}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
                isMuted
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              )}
            >
              {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button
              onClick={onHangUp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              <PhoneOff className="w-3 h-3" />
              Hang up
            </button>
          </>
        )}

        {callState.state === 'ENDED' && callState.error && onRetry && isOutbound && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <Phone className="w-3 h-3" />
            Retry call
          </button>
        )}
      </div>
    </div>
  );
}
