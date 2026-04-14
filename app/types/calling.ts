// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

// ============================================================================
// Call State Machine
// ============================================================================

export type CallState = 'IDLE' | 'RINGING' | 'CONNECTING' | 'ACTIVE' | 'ENDED';

export type CallDirection = 'inbound' | 'outbound';

export type PermissionState = 'none' | 'checking' | 'requesting' | 'pending' | 'granted' | 'denied' | 'rate_limited';

export type CallEndReason = 'local_hangup' | 'remote_hangup' | 'rejected' | 'missed' | 'failed';

export type CallEventType = 'started' | 'ended' | 'missed' | 'declined' | 'failed';

export interface CallMeta {
  callId: string;
  phoneNumberId: string;
  wabaId: string;
  callerNumber?: string;
  destPhone?: string;
  direction?: CallDirection;
  duration?: number;
  endReason?: CallEndReason;
}

export interface ActiveCallState {
  state: CallState;
  callId?: string;
  phoneNumberId?: string;
  wabaId?: string;
  callerNumber?: string;
  destPhone?: string;
  direction?: CallDirection;
  offerSdp?: string;
  startTime?: number;
  error?: string;
}

export interface CallPermissionInfo {
  status: 'no_permission' | 'temporary' | 'permanent';
  expirationTime?: number;
  canCall: boolean;
  canRequestPermission: boolean;
}

// ============================================================================
// Webhook Payload Types
// ============================================================================

export interface CallWebhookEvent {
  id: string;
  event: 'connect' | 'terminate' | 'failed';
  session?: {
    sdp: string;
    sdp_type: 'offer' | 'answer';
  };
}

export interface CallWebhookStatus {
  id: string;
  status: 'ringing' | 'accepted' | 'rejected' | 'completed' | 'failed';
}

// ============================================================================
// Ably Message Types
// ============================================================================

export interface AblyCallEvent {
  type: 'call_event';
  event: 'connect' | 'terminate' | 'failed';
  phoneNumberId: string;
  displayPhoneNumber: string;
  callerNumber: string;
  wabaId: string;
  callId: string;
  sdp?: string;
  sdpType?: string;
}

export interface AblyCallStatus {
  type: 'call_status';
  status: 'ringing' | 'accepted' | 'rejected' | 'completed' | 'failed';
  phoneNumberId: string;
  displayPhoneNumber: string;
  wabaId: string;
  callId: string;
}

export type AblyCallMessage = AblyCallEvent | AblyCallStatus;

// ============================================================================
// API Request Types
// ============================================================================

export interface CallAcceptRequest {
  phoneNumberId: string;
  wabaId: string;
  callId: string;
  sdp: string;
  sdpType: string;
}

export interface CallActionRequest {
  phoneNumberId: string;
  wabaId: string;
  callId: string;
}
