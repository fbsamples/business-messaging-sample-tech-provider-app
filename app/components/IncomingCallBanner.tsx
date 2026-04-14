// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use client';

import { useState, useEffect, useRef } from 'react';

import { Phone, PhoneOff, Mic, MicOff, Loader2 } from 'lucide-react';
import type { ActiveCallState } from '@/app/types/calling';
import type { CallingClient } from '@/app/components/CallingClient';
import { cn } from '@/lib/utils';

interface IncomingCallBannerProps {
  callState: ActiveCallState;
  callingClient: CallingClient | null;
  onAccept: () => void;
  onReject: () => void;
  onHangUp: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function IncomingCallBanner({
  callState,
  callingClient,
  onAccept,
  onReject,
  onHangUp,
}: IncomingCallBannerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Ringing sound
  useEffect(() => {
    if (callState.state === 'RINGING') {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const playRingBurst = () => {
        // Two-tone ring: 440Hz then 480Hz
        const now = ctx.currentTime;
        for (const [freq, start, end] of [[440, 0, 0.4], [480, 0.5, 0.9]] as const) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.15, now + start);
          gain.gain.exponentialRampToValueAtTime(0.001, now + end);
          osc.connect(gain).connect(ctx.destination);
          osc.start(now + start);
          osc.stop(now + end);
        }
      };

      playRingBurst();
      ringIntervalRef.current = setInterval(playRingBurst, 2000);

      return () => {
        if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
        ctx.close();
        audioCtxRef.current = null;
      };
    }
    // Stop ring if state changes away from RINGING
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    return undefined;
  }, [callState.state]);

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

  if (callState.state === 'IDLE' || !visible) return null;

  const handleMuteToggle = () => {
    if (callingClient) {
      const muted = callingClient.toggleMute();
      setIsMuted(muted);
    }
  };

  return (
    <div
      className={cn(
        'px-4 py-3 flex items-center justify-between border-b transition-all',
        callState.state === 'RINGING' && 'bg-green-50 border-green-200',
        callState.state === 'CONNECTING' && 'bg-blue-50 border-blue-200',
        callState.state === 'ACTIVE' && 'bg-emerald-50 border-emerald-200',
        callState.state === 'ENDED' && 'bg-gray-50 border-gray-200 opacity-60',
      )}
    >
      <div className="flex items-center gap-3">
        <Phone className={cn(
          'w-4 h-4',
          callState.state === 'RINGING' && 'text-green-600 animate-pulse',
          callState.state === 'CONNECTING' && 'text-blue-600',
          callState.state === 'ACTIVE' && 'text-emerald-600',
          callState.state === 'ENDED' && 'text-gray-400',
        )} />
        <div>
          {callState.state === 'RINGING' && (
            <span className="text-sm font-medium text-green-800">
              Incoming call from {callState.callerNumber ?? 'unknown'}
            </span>
          )}
          {callState.state === 'CONNECTING' && (
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
        {callState.state === 'RINGING' && (
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
      </div>
    </div>
  );
}
