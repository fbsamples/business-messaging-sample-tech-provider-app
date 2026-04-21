// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import type { CallState, CallMeta } from '@/app/types/calling';

// ============================================================================
// SDP Audio Codec Filtering
// ============================================================================

const ALLOWED_AUDIO_CODECS = ['opus', 'telephone-event'];

export function filterSDPAudioCodecs(sdp: string): string {
  const lines = sdp.split('\r\n');
  const result: string[] = [];

  // First pass: find payload types for allowed codecs in audio sections
  const allowedPayloadTypes = new Set<string>();
  let inAudioSection = false;

  for (const line of lines) {
    if (line.startsWith('m=audio')) inAudioSection = true;
    else if (line.startsWith('m=')) inAudioSection = false;

    if (inAudioSection) {
      const match = line.match(/^a=rtpmap:(\d+)\s+([\w-]+)\//);
      if (match) {
        const [, pt, codec] = match;
        if (ALLOWED_AUDIO_CODECS.includes(codec.toLowerCase())) {
          allowedPayloadTypes.add(pt);
        }
      }
    }
  }

  // Second pass: filter SDP lines
  inAudioSection = false;
  for (const line of lines) {
    if (line.startsWith('m=audio')) {
      inAudioSection = true;
      const parts = line.split(' ');
      if (parts.length >= 4) {
        const filtered = [parts[0], parts[1], parts[2],
          ...parts.slice(3).filter(pt => allowedPayloadTypes.has(pt))];
        result.push(filtered.join(' '));
      } else {
        result.push(line);
      }
      continue;
    }
    if (line.startsWith('m=')) inAudioSection = false;

    if (inAudioSection) {
      const ptMatch = line.match(/^a=(?:rtpmap|fmtp|rtcp-fb):(\d+)\s/);
      if (ptMatch && !allowedPayloadTypes.has(ptMatch[1])) {
        continue;
      }
    }

    result.push(line);
  }

  return result.join('\r\n');
}

// ============================================================================
// CallingClient
// ============================================================================

type StateChangeCallback = (state: CallState, meta?: CallMeta) => void;

export class CallingClient {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteAudio: HTMLAudioElement | null = null;
  private _state: CallState = 'IDLE';
  private onStateChange: StateChangeCallback;
  private answerSdp: string | null = null;

  constructor(onStateChange: StateChangeCallback) {
    this.onStateChange = onStateChange;
  }

  get state(): CallState {
    return this._state;
  }

  async acceptCall(offerSdp: string, phoneNumberId: string, wabaId: string, callId: string) {
    if (this._state !== 'IDLE' && this._state !== 'RINGING') {
      console.warn('Cannot accept call: already in state', this._state);
      return;
    }

    this.setState('CONNECTING');

    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // Capture remote audio track — play only when connection is established
    this.pc.ontrack = (event) => {
      console.log('[CallingClient] Remote track received:', event.track.kind);
      this.remoteAudio = new Audio();
      this.remoteAudio.srcObject = event.streams[0] ?? new MediaStream([event.track]);
    };

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      this.setState('ENDED', { callId, phoneNumberId, wabaId, endReason: 'failed' });
      throw new Error(
        'Microphone access is required to accept calls. Please allow microphone permission and try again.',
      );
    }

    this.localStream.getTracks().forEach(t => this.pc!.addTrack(t, this.localStream!));

    // Set codec preferences on audio transceiver (matching dogfood app)
    const transceivers = this.pc.getTransceivers();
    for (const transceiver of transceivers) {
      if (transceiver.receiver.track.kind === 'audio') {
        const capabilities = RTCRtpReceiver.getCapabilities('audio');
        if (capabilities) {
          const allowedCodecs = capabilities.codecs.filter(c =>
            ALLOWED_AUDIO_CODECS.some(name => c.mimeType.toLowerCase().includes(name))
          );
          if (allowedCodecs.length > 0) {
            transceiver.setCodecPreferences(allowedCodecs);
          }
        }
      }
    }

    const filteredOffer = filterSDPAudioCodecs(offerSdp);
    await this.pc.setRemoteDescription({ type: 'offer', sdp: filteredOffer });
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    this.answerSdp = answer.sdp ?? null;

    console.log('[CallingClient] SDP answer created, sending pre_accept');

    // Phase 1: pre_accept — start media negotiation
    const preAcceptRes = await fetch('/api/calls/pre-accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumberId, wabaId, callId, sdp: answer.sdp, sdpType: 'answer' }),
    });

    if (!preAcceptRes.ok) {
      const errText = await preAcceptRes.text();
      console.error('[CallingClient] pre_accept failed:', preAcceptRes.status, errText);
      this.cleanup();
      this.setState('ENDED', { callId, phoneNumberId, wabaId, endReason: 'failed' });
      return;
    }

    console.log('[CallingClient] pre_accept sent successfully');

    // Phase 2: accept — sent once WebRTC connects
    this.pc.onconnectionstatechange = () => {
      console.log('[CallingClient] Connection state:', this.pc?.connectionState);
      if (this.pc?.connectionState === 'connected') {
        // Start playing remote audio now that the call is established
        if (this.remoteAudio) {
          console.log('[CallingClient] Playing remote audio (inbound connected)');
          this.remoteAudio.play().catch(err => console.warn('[CallingClient] Audio play failed:', err));
        }
        fetch('/api/calls/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumberId, wabaId, callId, sdp: this.answerSdp, sdpType: 'answer' }),
        });
        this.setState('ACTIVE', { callId, phoneNumberId, wabaId });
      }
      if (this.pc?.connectionState === 'failed') {
        this.cleanup();
        this.setState('ENDED', { callId, phoneNumberId, wabaId, endReason: 'failed' });
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log('[CallingClient] ICE state:', this.pc?.iceConnectionState);
      if (this.pc?.iceConnectionState === 'failed') {
        this.cleanup();
        this.setState('ENDED', { callId, phoneNumberId, wabaId, endReason: 'failed' });
      }
    };
  }

  async startCall(phoneNumberId: string, wabaId: string, destPhone: string): Promise<string> {
    if (this._state !== 'IDLE') {
      console.warn('Cannot start call: already in state', this._state);
      throw new Error('A call is already in progress');
    }

    this.setState('CONNECTING');

    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // Capture remote audio track — don't play until answer SDP is received
    // and connection is established (avoids playing signaling tones)
    this.pc.ontrack = (event) => {
      console.log('[CallingClient] Remote track received:', event.track.kind, '— NOT playing yet (waiting for connected)');
      this.remoteAudio = new Audio();
      this.remoteAudio.srcObject = event.streams[0] ?? new MediaStream([event.track]);
    };

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      this.setState('ENDED', { callId: '', phoneNumberId, wabaId, destPhone, direction: 'outbound', endReason: 'failed' });
      throw new Error(
        'Microphone access is required to place calls. Please allow microphone permission and try again.',
      );
    }

    this.localStream.getTracks().forEach(t => this.pc!.addTrack(t, this.localStream!));

    // Set codec preferences on audio transceiver
    const transceivers = this.pc.getTransceivers();
    for (const transceiver of transceivers) {
      if (transceiver.sender.track?.kind === 'audio') {
        const capabilities = RTCRtpSender.getCapabilities('audio');
        if (capabilities) {
          const allowedCodecs = capabilities.codecs.filter(c =>
            ALLOWED_AUDIO_CODECS.some(name => c.mimeType.toLowerCase().includes(name))
          );
          if (allowedCodecs.length > 0) {
            transceiver.setCodecPreferences(allowedCodecs);
          }
        }
      }
    }

    const offer = await this.pc.createOffer();
    const filteredOffer = filterSDPAudioCodecs(offer.sdp!);
    await this.pc.setLocalDescription({ type: 'offer', sdp: filteredOffer });

    const res = await fetch('/api/calls/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumberId, wabaId, to: destPhone, sdp: filteredOffer, sdpType: 'offer' }),
    });

    if (!res.ok) {
      this.cleanup();
      this.setState('ENDED', { callId: '', phoneNumberId, wabaId, destPhone, direction: 'outbound', endReason: 'failed' });
      throw new Error('Failed to initiate call');
    }

    const data = await res.json();
    const callId = data.callId;

    // For outbound, ACTIVE is set by the 'accepted' status webhook, not by WebRTC
    // connection state. The WebRTC connection establishes when the answer SDP is
    // processed, but the user may not have picked up yet.
    this.pc.onconnectionstatechange = () => {
      console.log('[CallingClient] Connection state:', this.pc?.connectionState);
      if (this.pc?.connectionState === 'connected') {
        // Start playing remote audio now that media path is established
        if (this.remoteAudio) {
          console.log('[CallingClient] Playing remote audio (outbound connected)');
          this.remoteAudio.play().catch(err => console.warn('[CallingClient] Audio play failed:', err));
        }
      }
      if (this.pc?.connectionState === 'failed') {
        this.cleanup();
        this.setState('ENDED', { callId, phoneNumberId, wabaId, destPhone, direction: 'outbound', endReason: 'failed' });
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log('[CallingClient] ICE state:', this.pc?.iceConnectionState);
      if (this.pc?.iceConnectionState === 'failed') {
        this.cleanup();
        this.setState('ENDED', { callId, phoneNumberId, wabaId, destPhone, direction: 'outbound', endReason: 'failed' });
      }
    };

    return callId;
  }

  handleAnswerSdp(sdp: string) {
    if (!this.pc) return;
    // Unescape SDP newlines (webhook may deliver escaped \r\n)
    const unescaped = sdp.replace(/\\r\\n/g, '\r\n');
    const filtered = filterSDPAudioCodecs(unescaped);
    // ACTIVE state will be set by onconnectionstatechange
    this.pc.setRemoteDescription({ type: 'answer', sdp: filtered });
  }

  toggleMute(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled; // true = muted
      }
    }
    return false;
  }

  async hangUp(phoneNumberId: string, wabaId: string, callId: string) {
    await fetch('/api/calls/terminate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumberId, wabaId, callId }),
    });
    this.cleanup();
    this.setState('ENDED', { callId, phoneNumberId, wabaId, endReason: 'local_hangup' });
  }

  async rejectCall(phoneNumberId: string, wabaId: string, callId: string) {
    await fetch('/api/calls/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumberId, wabaId, callId }),
    });
    this.cleanup();
    this.setState('ENDED', { callId, phoneNumberId, wabaId, endReason: 'rejected' });
  }

  onRemoteEnd(callId: string, phoneNumberId: string, wabaId: string, reason: 'remote_hangup' | 'failed') {
    this.cleanup();
    this.setState('ENDED', { callId, phoneNumberId, wabaId, endReason: reason });
  }

  cleanup() {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    if (this.remoteAudio) {
      this.remoteAudio.srcObject = null;
      this.remoteAudio = null;
    }
    this.answerSdp = null;
    this._state = 'IDLE';
  }

  private setState(state: CallState, meta?: CallMeta) {
    this._state = state;
    this.onStateChange(state, meta);
    // Reset internal state after ENDED so the next call can be accepted
    if (state === 'ENDED') {
      this._state = 'IDLE';
    }
  }
}
