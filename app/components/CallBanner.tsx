// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use client';

import { useState, useEffect, useRef } from 'react';

import { Phone, PhoneOff, PhoneOutgoing, Mic, MicOff, Loader2, ShieldCheck, ShieldX } from 'lucide-react';
import type { ActiveCallState, PermissionState } from '@/app/types/calling';
import type { CallingClient } from '@/app/components/CallingClient';
import { cn } from '@/lib/utils';

interface CallBannerProps {
  callState: ActiveCallState;
  callingClient: CallingClient | null;
  permissionState: PermissionState;
  onAccept: () => void;
  onReject: () => void;
  onHangUp: () => void;
  onRequestPermission: () => void;
  onCallNow: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function CallBanner({
  callState,
  callingClient,
  permissionState,
  onAccept,
  onReject,
  onHangUp,
  onRequestPermission,
  onCallNow,
}: CallBannerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const isInbound = callState.direction === 'inbound';
  const isOutbound = callState.direction === 'outbound';

  // Ringing sound — inbound: two-tone alert ring; outbound: softer ringback tone
  useEffect(() => {
    const shouldPlayInbound = callState.state === 'RINGING' && isInbound;
    const shouldPlayOutbound = isOutbound && (callState.state === 'CONNECTING' || callState.state === 'RINGING');

    if (shouldPlayInbound || shouldPlayOutbound) {
      // If outbound ringback is already playing, don't restart (avoids gap on CONNECTING→RINGING)
      if (shouldPlayOutbound && ringIntervalRef.current) return undefined;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      if (shouldPlayInbound) {
        // Inbound: two-tone ring (440Hz + 480Hz)
        const playRingBurst = () => {
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
      } else {
        // Outbound: gentle ringback tone (440Hz, 2s on / 4s off)
        const playRingback = () => {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = 440;
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.setValueAtTime(0.08, now + 1.8);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 2);
          osc.connect(gain).connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 2);
        };
        playRingback();
        ringIntervalRef.current = setInterval(playRingback, 4000);
      }

      return () => {
        if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
        ctx.close();
        audioCtxRef.current = null;
      };
    }

    // State left ringing — clean up
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    return undefined;
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

  // Fade out on ENDED or DENIED
  useEffect(() => {
    if (callState.state === 'ENDED' || permissionState === 'denied') {
      const timeout = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timeout);
    }
    setVisible(true);
    return undefined;
  }, [callState.state, permissionState]);

  // Reset mute when call ends
  useEffect(() => {
    if (callState.state !== 'ACTIVE') setIsMuted(false);
  }, [callState.state]);

  // Show banner for permission states or active call states
  const showForPermission = permissionState !== 'none';
  const showForCall = callState.state !== 'IDLE';

  if (!showForPermission && !showForCall) return null;
  if (!visible) return null;

  const handleMuteToggle = () => {
    if (callingClient) {
      const muted = callingClient.toggleMute();
      setIsMuted(muted);
    }
  };

  // Permission states UI
  if (showForPermission && callState.state === 'IDLE') {
    return (
      <div
        className={cn(
          'px-4 py-3 flex items-center justify-between border-b transition-all',
          permissionState === 'checking' && 'bg-blue-50 border-blue-200',
          permissionState === 'requesting' && 'bg-amber-50 border-amber-200',
          permissionState === 'pending' && 'bg-blue-50 border-blue-200',
          permissionState === 'granted' && 'bg-green-50 border-green-200',
          permissionState === 'denied' && 'bg-red-50 border-red-200 opacity-60',
          permissionState === 'rate_limited' && 'bg-orange-50 border-orange-200',
        )}
      >
        <div className="flex items-center gap-3">
          {permissionState === 'checking' ? (
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          ) : permissionState === 'granted' ? (
            <ShieldCheck className="w-4 h-4 text-green-600" />
          ) : permissionState === 'denied' ? (
            <ShieldX className="w-4 h-4 text-red-500" />
          ) : (
            <PhoneOutgoing className="w-4 h-4 text-amber-600" />
          )}
          <div>
            {permissionState === 'checking' && (
              <span className="text-sm font-medium text-blue-800 flex items-center gap-2">
                Checking call permissions...
              </span>
            )}
            {permissionState === 'requesting' && (
              <span className="text-sm font-medium text-amber-800">
                Call permission required
              </span>
            )}
            {permissionState === 'pending' && (
              <span className="text-sm font-medium text-blue-800 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Permission request sent — waiting for response
              </span>
            )}
            {permissionState === 'granted' && (
              <span className="text-sm font-medium text-green-800">
                Permission granted!
              </span>
            )}
            {permissionState === 'denied' && (
              <span className="text-sm text-red-600">
                Permission declined
              </span>
            )}
            {permissionState === 'rate_limited' && (
              <span className="text-sm text-orange-700">
                Request limit reached — try again later
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {permissionState === 'requesting' && (
            <button
              onClick={onRequestPermission}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors"
            >
              Request Permission
            </button>
          )}
          {permissionState === 'granted' && (
            <button
              onClick={onCallNow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              <Phone className="w-3 h-3" />
              Call Now
            </button>
          )}
        </div>
      </div>
    );
  }

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
              Incoming call from {callState.callerNumber ?? 'unknown'}
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
      </div>
    </div>
  );
}
