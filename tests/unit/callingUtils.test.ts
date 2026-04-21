// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDuration,
  formatTimeRemaining,
  formatRemainingRequests,
  generateRingToneBlob,
} from '@/app/utils/calling';

describe('formatDuration', () => {
  it('formats zero seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('0:45');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2:05');
  });

  it('pads single-digit seconds', () => {
    expect(formatDuration(61)).toBe('1:01');
  });

  it('formats large durations', () => {
    expect(formatDuration(3661)).toBe('61:01');
  });
});

describe('formatTimeRemaining', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-17T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "expired" for past time', () => {
    const pastTime = Date.now() - 60000;
    expect(formatTimeRemaining(pastTime)).toBe('expired');
  });

  it('formats minutes only', () => {
    const future = Date.now() + 45 * 60000;
    expect(formatTimeRemaining(future)).toBe('45m');
  });

  it('formats hours and minutes', () => {
    const future = Date.now() + (3 * 60 + 15) * 60000;
    expect(formatTimeRemaining(future)).toBe('3h 15m');
  });

  it('formats days, hours and minutes', () => {
    const future = Date.now() + (2 * 1440 + 5 * 60 + 30) * 60000;
    expect(formatTimeRemaining(future)).toBe('2d 5h 30m');
  });

  it('handles exactly zero minutes remaining', () => {
    const future = Date.now() + 29999; // less than 1 minute
    expect(formatTimeRemaining(future)).toBe('0m');
  });
});

describe('formatRemainingRequests', () => {
  it('returns undefined when no actions', () => {
    expect(formatRemainingRequests([])).toBeUndefined();
  });

  it('returns undefined when no send_call_permission_request action', () => {
    const actions = [
      { action_name: 'start_call', can_perform_action: true, limits: [{ time_period: 'PT24H', max_allowed: 100, current_usage: 0 }] },
    ];
    expect(formatRemainingRequests(actions)).toBeUndefined();
  });

  it('returns undefined when no limits', () => {
    const actions = [
      { action_name: 'send_call_permission_request', can_perform_action: true },
    ];
    expect(formatRemainingRequests(actions)).toBeUndefined();
  });

  it('returns undefined when all limits exhausted', () => {
    const actions = [
      {
        action_name: 'send_call_permission_request',
        can_perform_action: false,
        limits: [{ time_period: 'PT24H', max_allowed: 1, current_usage: 1 }],
      },
    ];
    expect(formatRemainingRequests(actions)).toBeUndefined();
  });

  it('formats single limit with remaining requests', () => {
    const actions = [
      {
        action_name: 'send_call_permission_request',
        can_perform_action: true,
        limits: [{ time_period: 'PT24H', max_allowed: 3, current_usage: 1 }],
      },
    ];
    expect(formatRemainingRequests(actions)).toBe('2 requests left today');
  });

  it('uses singular "request" for 1 remaining', () => {
    const actions = [
      {
        action_name: 'send_call_permission_request',
        can_perform_action: true,
        limits: [{ time_period: 'PT24H', max_allowed: 1, current_usage: 0 }],
      },
    ];
    expect(formatRemainingRequests(actions)).toBe('1 request left today');
  });

  it('picks the most restrictive limit', () => {
    const actions = [
      {
        action_name: 'send_call_permission_request',
        can_perform_action: true,
        limits: [
          { time_period: 'PT24H', max_allowed: 1, current_usage: 0 },
          { time_period: 'P7D', max_allowed: 2, current_usage: 0 },
        ],
      },
    ];
    expect(formatRemainingRequests(actions)).toBe('1 request left today');
  });

  it('maps P7D to "this week"', () => {
    const actions = [
      {
        action_name: 'send_call_permission_request',
        can_perform_action: true,
        limits: [{ time_period: 'P7D', max_allowed: 2, current_usage: 1 }],
      },
    ];
    expect(formatRemainingRequests(actions)).toBe('1 request left this week');
  });

  it('shows raw period for unknown formats', () => {
    const actions = [
      {
        action_name: 'send_call_permission_request',
        can_perform_action: true,
        limits: [{ time_period: 'P30D', max_allowed: 5, current_usage: 2 }],
      },
    ];
    expect(formatRemainingRequests(actions)).toBe('3 requests left P30D');
  });
});

describe('generateRingToneBlob', () => {
  it('generates inbound ring tone as WAV blob', () => {
    const blob = generateRingToneBlob('inbound');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('audio/wav');
    expect(blob.size).toBeGreaterThan(44); // at least WAV header
  });

  it('generates outbound ring tone as WAV blob', () => {
    const blob = generateRingToneBlob('outbound');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('audio/wav');
    expect(blob.size).toBeGreaterThan(44);
  });

  it('outbound is longer than inbound', () => {
    const inbound = generateRingToneBlob('inbound');
    const outbound = generateRingToneBlob('outbound');
    expect(outbound.size).toBeGreaterThan(inbound.size);
  });

  it('generates valid WAV header', async () => {
    const blob = generateRingToneBlob('inbound');
    const buffer = await blob.arrayBuffer();
    const view = new DataView(buffer);
    // RIFF header
    expect(String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))).toBe('RIFF');
    // WAVE format
    expect(String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11))).toBe('WAVE');
    // fmt chunk
    expect(String.fromCharCode(view.getUint8(12), view.getUint8(13), view.getUint8(14), view.getUint8(15))).toBe('fmt ');
    // PCM format (1)
    expect(view.getUint16(20, true)).toBe(1);
    // Mono (1 channel)
    expect(view.getUint16(22, true)).toBe(1);
    // Sample rate 8000
    expect(view.getUint32(24, true)).toBe(8000);
    // 16-bit samples
    expect(view.getUint16(34, true)).toBe(16);
    // data chunk
    expect(String.fromCharCode(view.getUint8(36), view.getUint8(37), view.getUint8(38), view.getUint8(39))).toBe('data');
  });
});
