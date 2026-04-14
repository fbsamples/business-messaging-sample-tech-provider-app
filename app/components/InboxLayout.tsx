// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import Ably from 'ably';

import PhoneListSidebar from '@/app/components/PhoneListSidebar';
import ConversationView, { type Message } from '@/app/components/ConversationView';
import PhoneRegistrationModal from '@/app/components/PhoneRegistrationModal';
import PhoneStatus from '@/app/components/PhoneStatus';
import AckBotStatus from '@/app/components/AckBotStatus';
import CallingStatus from '@/app/components/CallingStatus';
import type { PhoneDetails } from '@/app/types/api';
import { CallingClient } from '@/app/components/CallingClient';
import CallBanner from '@/app/components/CallBanner';
import type { ActiveCallState, PermissionState } from '@/app/types/calling';
import { cn } from '@/lib/utils';

type ChatMeta = {
  displayName: string;
  lastMessage?: string;
  lastTimestamp?: number;
};

type ChannelTab = 'whatsapp' | 'messenger' | 'instagram';

export default function InboxLayout({ phones }: { phones: PhoneDetails[] }) {
  const [selectedPhone, setSelectedPhone] = useState<PhoneDetails | null>(phones[0] ?? null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<ChannelTab>('whatsapp');

  // Global message state: { [phone_number_id]: { [chat_id]: Message[] } }
  const [allMessages, setAllMessages] = useState<Record<string, Record<string, Message[]>>>({});

  // Global chat metadata: { [phone_number_id]: { [chat_id]: ChatMeta } }
  const [allChats, setAllChats] = useState<Record<string, Record<string, ChatMeta>>>({});
  // Unread tracking: { [phone_number_id]: Set<chat_id> }
  // A chat is unread if an incoming message arrived while it was not the active view.
  const [unreadChats, setUnreadChats] = useState<Record<string, Set<string>>>({});

  // OTP modal state
  const [otpModalPhone, setOtpModalPhone] = useState<PhoneDetails | null>(null);

  // Call state
  const [callState, setCallState] = useState<ActiveCallState>({ state: 'IDLE' });
  const [permissionState, setPermissionState] = useState<PermissionState>('none');
  const permissionTargetRef = useRef<string | null>(null); // destPhone for permission flow
  const callingClientRef = useRef<CallingClient | null>(null);
  const callStateRef = useRef(callState);
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // Ably connection status: 'connecting' | 'connected' | 'disconnected' | 'failed'
  const [ablyState, setAblyState] = useState<string>('connecting');


  // Phone status tracking
  const [phoneStatuses, setPhoneStatuses] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    phones.forEach((p) => {
      initial[p.id] = p.status;
    });
    return initial;
  });

  const handlePhoneStatusChange = useCallback((phoneId: string, newStatus: string) => {
    setPhoneStatuses((prev) => ({ ...prev, [phoneId]: newStatus }));
  }, []);

  // Mark a chat as unread (used when a message arrives for a non-active chat)
  const markUnread = useCallback((phoneId: string, chatId: string) => {
    setUnreadChats((prev) => {
      const phoneSet = new Set(prev[phoneId] ?? []);
      phoneSet.add(chatId);
      return { ...prev, [phoneId]: phoneSet };
    });
  }, []);

  // Clear unread status for a chat when the user opens it
  const markRead = useCallback((phoneId: string, chatId: string) => {
    setUnreadChats((prev) => {
      const phoneSet = new Set(prev[phoneId] ?? []);
      phoneSet.delete(chatId);
      return { ...prev, [phoneId]: phoneSet };
    });
  }, []);

  // Reset selected chat when switching phones — prevents a chat from a previous
  // phone appearing in the conversation pane of the newly selected phone.
  const prevSelectedPhoneIdRef = useRef<string | null>(selectedPhone?.id ?? null);
  useEffect(() => {
    if (selectedPhone?.id !== prevSelectedPhoneIdRef.current) {
      setSelectedChatId(null);
      prevSelectedPhoneIdRef.current = selectedPhone?.id ?? null;
    }
  }, [selectedPhone?.id]);

  // Refs for Ably callback access to latest state without re-subscribing
  const phonesRef = useRef(phones);
  const selectedPhoneRef = useRef(selectedPhone);
  const selectedChatIdRef = useRef(selectedChatId);
  const phoneStatusesRef = useRef(phoneStatuses);
  useEffect(() => {
    phonesRef.current = phones;
  }, [phones]);
  useEffect(() => {
    selectedPhoneRef.current = selectedPhone;
  }, [selectedPhone]);
  useEffect(() => {
    phoneStatusesRef.current = phoneStatuses;
  }, [phoneStatuses]);
  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);
  // Auto-clear unread when a chat becomes visible (handles both manual click and auto-open)
  useEffect(() => {
    if (selectedPhone && selectedChatId) {
      markRead(selectedPhone.id, selectedChatId);
    }
  }, [selectedPhone, selectedChatId, markRead]);

  // State management functions
  const addMessage = useCallback((phoneId: string, chatId: string, message: Message) => {
    setAllMessages((prev) => {
      const phoneMsgs = prev[phoneId] ?? {};
      const chatMsgs = phoneMsgs[chatId] ?? [];
      return {
        ...prev,
        [phoneId]: {
          ...phoneMsgs,
          [chatId]: [...chatMsgs, message],
        },
      };
    });
  }, []);

  // Initialize CallingClient
  useEffect(() => {
    callingClientRef.current = new CallingClient((state, meta) => {
      setCallState(prev => ({
        ...prev,
        state,
        ...(meta?.direction ? { direction: meta.direction } : {}),
        ...(meta?.destPhone ? { destPhone: meta.destPhone } : {}),
        ...(meta?.callId ? { callId: meta.callId } : {}),
        ...(meta?.endReason === 'failed' ? { error: 'Connection failed' } : {}),
      }));

      // Reset to IDLE after ENDED so the next call can come through
      if (state === 'ENDED') {
        setTimeout(() => {
          setCallState({ state: 'IDLE' });
          setPermissionState('none');
          permissionTargetRef.current = null;
        }, 4000);
      }

      // Determine the chat thread ID (callerNumber for inbound, destPhone for outbound)
      const chatId = meta?.callerNumber ?? meta?.destPhone;

      // Insert call event bubble into message thread
      if (meta?.phoneNumberId && chatId) {
        if (state === 'ACTIVE') {
          addMessage(meta.phoneNumberId, chatId, {
            type: 'call_event',
            event: 'started',
            timestamp: Date.now(),
          } as Message);
        }
        if (state === 'ENDED' && meta.endReason) {
          // remote_hangup bubble is added by the Ably terminate handler (with webhook duration)
          const eventMap: Record<string, Message> = {
            rejected: { type: 'call_event', event: 'declined', timestamp: Date.now() } as Message,
            missed: { type: 'call_event', event: 'missed', timestamp: Date.now() } as Message,
            failed: { type: 'call_event', event: 'failed', timestamp: Date.now() } as Message,
          };
          const msg = eventMap[meta.endReason];
          if (msg) addMessage(meta.phoneNumberId, chatId, msg);
        }
      }
    });

    return () => {
      callingClientRef.current?.cleanup();
    };
  }, [addMessage]);

  const addChat = useCallback((phoneId: string, chatId: string, displayName: string, lastMessage?: string) => {
    setAllChats((prev) => {
      const phoneChats = prev[phoneId] ?? {};
      return {
        ...prev,
        [phoneId]: {
          ...phoneChats,
          [chatId]: { displayName, lastMessage, lastTimestamp: Date.now() },
        },
      };
    });
  }, []);

  // Send message handler
  const handleSendMessage = useCallback(
    (phone: PhoneDetails, chatId: string, text: string) => {
      // Only update local inbox state for CONNECTED phones — prevents chats from
      // leaking into the inbox of phones that are Pending or Disconnected.
      if (phoneStatusesRef.current[phone.id] === 'CONNECTED') {
        addMessage(phone.id, chatId, {
          type: 'text',
          text,
          direction: 'outgoing',
          timestamp: Date.now(),
        });
        addChat(phone.id, chatId, allChats[phone.id]?.[chatId]?.displayName ?? chatId, text);
      }

      fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waba_id: phone.wabaId,
          phone_number_id: phone.id,
          dest_phone: chatId,
          message_content: text,
        }),
      }).catch((error) => {
        console.error('Failed to send message:', error);
        addMessage(phone.id, chatId, {
          type: 'text',
          text: 'Failed to send message',
          direction: 'outgoing',
          timestamp: Date.now(),
        });
      });
    },
    [addMessage, addChat, allChats],
  );

  const handleAcceptCall = useCallback(async () => {
    const cs = callStateRef.current;
    console.log('[Calling] handleAcceptCall called, state:', cs.state, 'hasOffer:', !!cs.offerSdp, 'phoneNumberId:', cs.phoneNumberId, 'callId:', cs.callId);
    if (!cs.offerSdp || !cs.phoneNumberId || !cs.wabaId || !cs.callId) return;
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    try {
      await callingClientRef.current?.acceptCall(
        cs.offerSdp,
        cs.phoneNumberId,
        cs.wabaId,
        cs.callId,
      );
    } catch (err) {
      setCallState(prev => ({
        ...prev,
        state: 'ENDED',
        error: err instanceof Error ? err.message : 'Failed to accept call',
      }));
    }
  }, []);

  const handleRejectCall = useCallback(async () => {
    const cs = callStateRef.current;
    if (!cs.phoneNumberId || !cs.wabaId || !cs.callId) return;
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    await callingClientRef.current?.rejectCall(
      cs.phoneNumberId,
      cs.wabaId,
      cs.callId,
    );
  }, []);

  const handleHangUp = useCallback(async () => {
    const cs = callStateRef.current;
    if (!cs.phoneNumberId || !cs.wabaId || !cs.callId) return;
    await callingClientRef.current?.hangUp(
      cs.phoneNumberId,
      cs.wabaId,
      cs.callId,
    );
  }, []);

  const startOutboundCall = useCallback(async (phoneNumberId: string, wabaId: string, destPhone: string) => {
    setCallState({
      state: 'CONNECTING',
      direction: 'outbound',
      phoneNumberId,
      wabaId,
      destPhone,
    });
    setPermissionState('none');

    try {
      const callId = await callingClientRef.current?.startCall(phoneNumberId, wabaId, destPhone);
      if (callId) {
        setCallState(prev => ({ ...prev, callId }));
      }
    } catch (err) {
      console.error('[Calling] startCall failed:', err);
      setCallState(prev => ({
        ...prev,
        state: 'ENDED',
        error: err instanceof Error ? err.message : 'Failed to start call',
      }));
    }
  }, []);

  // Outbound call: check permission and start call or show permission UI
  const handleCallClick = useCallback(async (chatId: string) => {
    const phone = selectedPhoneRef.current;
    if (!phone) return;
    if (callStateRef.current.state !== 'IDLE') return;

    permissionTargetRef.current = chatId;
    // Show "Checking..." while we query the API — don't show "permission required" yet
    setPermissionState('checking');

    try {
      const res = await fetch(
        `/api/calls/permissions?phoneNumberId=${phone.id}&wabaId=${phone.wabaId}&userWaId=${chatId}`,
      );
      const data = await res.json();

      console.log('[Calling] Permission check response:', JSON.stringify(data));

      if (data.error) {
        console.error('[Calling] Permission check error:', data.error);
        setPermissionState('none');
        return;
      }

      // Response shape: { permission: { status: "permanent"|"temporary"|... }, actions: [...] }
      const permStatus = data.permission?.status;
      const hasPermission = permStatus === 'permanent' || permStatus === 'temporary';

      if (hasPermission) {
        // Permission granted — start call immediately
        setPermissionState('none');
        await startOutboundCall(phone.id, phone.wabaId, chatId);
      } else {
        // Check if we can request permission or are rate limited
        const sendAction = data.actions?.find(
          (a: { action_name: string }) => a.action_name === 'send_call_permission_request',
        );
        if (sendAction && sendAction.can_perform_action === false) {
          setPermissionState('rate_limited');
        } else {
          setPermissionState('requesting');
        }
      }
    } catch (err) {
      console.error('[Calling] Permission check failed:', err);
      setPermissionState('none');
    }
  }, [startOutboundCall]);

  const handleRequestPermission = useCallback(async () => {
    const phone = selectedPhoneRef.current;
    const destPhone = permissionTargetRef.current;
    if (!phone || !destPhone) return;

    setPermissionState('pending');

    try {
      const res = await fetch('/api/calls/request-permission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId: phone.id,
          wabaId: phone.wabaId,
          to: destPhone,
        }),
      });

      const data = await res.json();
      console.log('[Calling] Permission request response:', res.status, JSON.stringify(data));

      if (!res.ok) {
        console.error('[Calling] Permission request failed:', data.error);
        setPermissionState('requesting');
      }
      // Stay in 'pending' — wait for webhook reply
    } catch (err) {
      console.error('[Calling] Permission request error:', err);
      setPermissionState('requesting');
    }
  }, []);

  const handleCallNow = useCallback(async () => {
    const phone = selectedPhoneRef.current;
    const destPhone = permissionTargetRef.current;
    if (!phone || !destPhone) return;
    await startOutboundCall(phone.id, phone.wabaId, destPhone);
  }, [startOutboundCall]);

  // Ably connection — single connection for ALL phones
  useEffect(() => {
    const ablyClient = new Ably.Realtime({
      authCallback: async (_, callback) => {
        try {
          const response = await fetch('/api/ably-auth');
          const tokenRequest = await response.json();
          callback(null, tokenRequest);
        } catch (error) {
          callback(error, null);
        }
      },
    });

    ablyClient.connection.on('connected', () => {
      setAblyState('connected');
    });

    ablyClient.connection.on('connecting', () => {
      setAblyState('connecting');
    });

    ablyClient.connection.on('disconnected', () => {
      setAblyState('disconnected');
    });

    ablyClient.connection.on('suspended', () => {
      setAblyState('failed');
    });

    ablyClient.connection.on('failed', () => {
      setAblyState('failed');
    });

    const channel = ablyClient.channels.get('get-started');
    channel.subscribe('first', (message) => {
      const ownedPhoneIds = new Set(phonesRef.current.map((p) => p.id));
      const fields = message.data.entry?.flatMap((e: any) => e.changes?.map((c: any) => c.field));
      console.log('[Webhook] Received first event. fields:', fields, 'owned phones:', [...ownedPhoneIds]);

      // Process each change in the webhook payload
      for (const entry of message.data.entry ?? []) {
        for (const change of entry.changes ?? []) {
          const value = change.value;
          const field = change.field;
          const phoneId = value?.metadata?.phone_number_id;

          if (!phoneId || !ownedPhoneIds.has(phoneId)) continue;

          // Handle calling webhooks
          if (field === 'calls') {
            const call = value?.calls?.[0];
            if (call) {
              console.log('[Calling] Received call event:', call.event, 'sdp_type:', call.session?.sdp_type, 'from:', call.from);

              // Direction-aware connect webhook handling
              if (call.event === 'connect' && call.session?.sdp) {
                const currentState = callStateRef.current.state;
                const sdpType = call.session.sdp_type;

                if (currentState === 'IDLE' && sdpType === 'offer') {
                  // INBOUND: new incoming call with offer SDP
                  setCallState({
                    state: 'RINGING',
                    direction: 'inbound',
                    callId: call.id,
                    phoneNumberId: phoneId,
                    wabaId: entry.id,
                    callerNumber: call.from,
                    offerSdp: call.session.sdp,
                  });

                  if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
                  ringTimeoutRef.current = setTimeout(() => {
                    if (callStateRef.current.state === 'RINGING' && callStateRef.current.direction === 'inbound') {
                      callingClientRef.current?.onRemoteEnd(call.id, phoneId, entry.id, 'failed');
                      setCallState(prev => ({ ...prev, state: 'ENDED', error: undefined }));
                      setTimeout(() => setCallState({ state: 'IDLE' }), 4000);
                      addMessage(phoneId, call.from, {
                        type: 'call_event', event: 'missed', timestamp: Date.now(),
                      } as Message);
                    }
                  }, 30000);

                } else if (
                  (currentState === 'CONNECTING' || currentState === 'RINGING')
                  && sdpType === 'answer'
                  && callStateRef.current.direction === 'outbound'
                  && call.id === callStateRef.current.callId
                ) {
                  // OUTBOUND: answer SDP for our pending outbound call
                  console.log('[Calling] Outbound answer SDP received');
                  callingClientRef.current?.handleAnswerSdp(call.session.sdp);
                  // ACTIVE state is set by onconnectionstatechange
                } else {
                  console.warn('[Calling] Ignoring connect webhook: state=', currentState,
                    'sdpType=', sdpType, 'callId=', call.id);
                }
              }

              if (call.event === 'terminate') {
                console.log('[Calling] Terminate webhook: state=', callStateRef.current.state,
                  'direction=', callStateRef.current.direction, 'callId=', call.id);
                if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
                // For outbound, use destPhone as the chat thread; for inbound, use callerNumber
                const chatThreadId = callStateRef.current.direction === 'outbound'
                  ? callStateRef.current.destPhone ?? call.from
                  : callStateRef.current.callerNumber ?? call.from;

                if ((callStateRef.current.state === 'RINGING' || callStateRef.current.state === 'CONNECTING')
                  && callStateRef.current.direction === 'inbound') {
                  setCallState(prev => ({ ...prev, state: 'ENDED' }));
                  setTimeout(() => setCallState({ state: 'IDLE' }), 4000);
                  addMessage(phoneId, chatThreadId, {
                    type: 'call_event', event: 'missed', timestamp: Date.now(),
                  } as Message);
                } else if (callStateRef.current.state === 'ACTIVE' || callStateRef.current.state === 'CONNECTING' || callStateRef.current.state === 'RINGING') {
                  callingClientRef.current?.onRemoteEnd(call.id, phoneId, entry.id, 'remote_hangup');
                  addMessage(phoneId, chatThreadId, {
                    type: 'call_event', event: 'ended', duration: call.duration, timestamp: Date.now(),
                  } as Message);
                } else {
                  // Local hangup already processed — just add the duration bubble
                  if (call.duration) {
                    addMessage(phoneId, chatThreadId, {
                      type: 'call_event', event: 'ended', duration: call.duration, timestamp: Date.now(),
                    } as Message);
                  }
                }
              }

              if (call.event === 'failed') {
                if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
                callingClientRef.current?.onRemoteEnd(call.id, phoneId, entry.id, 'failed');
              }
            }

            // Handle call statuses (outbound)
            const status = value?.statuses?.[0];
            if (status
              && callStateRef.current.direction === 'outbound'
              && status.id === callStateRef.current.callId) {
              const statusLower = status.status?.toLowerCase();
              console.log('[Calling] Outbound status:', statusLower);
              if (statusLower === 'ringing') {
                setCallState(prev => ({ ...prev, state: 'RINGING' }));
              } else if (statusLower === 'accepted') {
                // User picked up — transition to ACTIVE and start the timer
                setCallState(prev => ({ ...prev, state: 'ACTIVE' }));
              } else if (statusLower === 'failed') {
                callingClientRef.current?.onRemoteEnd(status.id, phoneId, entry.id, 'failed');
              } else if (statusLower === 'rejected') {
                const destPhone = callStateRef.current.destPhone ?? '';
                callingClientRef.current?.cleanup();
                setCallState(prev => ({ ...prev, state: 'ENDED' }));
                setTimeout(() => {
                  setCallState({ state: 'IDLE' });
                  setPermissionState('none');
                  permissionTargetRef.current = null;
                }, 4000);
                if (destPhone) {
                  addMessage(phoneId, destPhone, {
                    type: 'call_event', event: 'declined', timestamp: Date.now(),
                  } as Message);
                }
              }
            }

            continue;
          }

          // Handle messaging webhooks
          if (field === 'messages' || !field) {
            const msgData = value?.messages?.[0];

            // Check for call_permission_reply
            if (msgData?.type === 'interactive'
              && msgData?.interactive?.type === 'call_permission_reply') {
              const reply = msgData.interactive.call_permission_reply;
              if (reply.response === 'accept') {
                setPermissionState('granted');
              } else if (reply.response === 'reject') {
                setPermissionState('denied');
              }
              continue;
            }

            if (phoneStatusesRef.current[phoneId] !== 'CONNECTED') continue;

            const text = msgData?.text?.body;
            if (!text) continue;

            const fromField = msgData?.from;
            const isAckBot = fromField === '_ackbot_';
            const consumerPhone = isAckBot ? msgData?._ackbot_recipient : fromField;
            const displayName = value?.contacts?.[0]?.profile?.name;
            const msgTimestamp = msgData?.timestamp;

            addMessage(phoneId, consumerPhone, {
              type: 'text',
              text,
              direction: isAckBot ? 'outgoing' : 'incoming',
              timestamp: msgTimestamp ? msgTimestamp * 1000 : Date.now(),
            });

            if (!isAckBot) {
              addChat(phoneId, consumerPhone, displayName ?? consumerPhone, text);
            }
            const isCurrentlyViewing =
              phoneId === selectedPhoneRef.current?.id &&
              consumerPhone === selectedChatIdRef.current;
            if (!isAckBot && !isCurrentlyViewing) {
              markUnread(phoneId, consumerPhone);
            }
            if (phoneId === selectedPhoneRef.current?.id && !selectedChatIdRef.current) {
              setSelectedChatId(consumerPhone);
            }
          }
        }
      }
    });

    return () => {
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      channel.unsubscribe();
      ablyClient.close();
    };
  }, [addMessage, addChat, markUnread]);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-gray-50">
      {/* Channel Tab Bar */}
      <div className="bg-white border-b border-gray-100 px-6 flex items-center gap-1 h-12 flex-shrink-0">
        {/* WhatsApp — active */}
        <button
          onClick={() => setActiveChannel('whatsapp')}
          className={cn(
            'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
            activeChannel === 'whatsapp'
              ? 'bg-[#25D366]/10 text-[#128C7E] ring-1 ring-[#25D366]/30'
              : 'text-gray-400 hover:bg-gray-100',
          )}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          WhatsApp
        </button>

        {/* Messenger — coming soon */}
        <div className="relative group">
          <button
            disabled
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-gray-300 cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259L10.732 8.2l3.131 3.259L19.752 8.2l-6.559 6.763z" />
            </svg>
            Messenger
          </button>
          <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 text-[11px] text-slate-700 bg-white border border-slate-200 rounded-lg shadow-md whitespace-normal opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            Coming soon
          </span>
        </div>

        {/* Instagram — coming soon */}
        <div className="relative group">
          <button
            disabled
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-gray-300 cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            Instagram
          </button>
          <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 text-[11px] text-slate-700 bg-white border border-slate-200 rounded-lg shadow-md whitespace-normal opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            Coming soon
          </span>
        </div>
      </div>

      {/* Main 2-panel layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Phone list */}
        <PhoneListSidebar
          phones={phones}
          selectedPhoneId={selectedPhone?.id ?? null}
          onSelectPhone={setSelectedPhone}
        />

        {/* Right: Conversation area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedPhone ? (
            <>
              {/* Phone header */}
              <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                    {selectedPhone.display_phone_number.replace(/\D/g, '').slice(-2)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{selectedPhone.display_phone_number}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-gray-400">WhatsApp Business Account</span>
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded font-semibold',
                          selectedPhone.is_on_biz_app ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700',
                        )}
                      >
                        {selectedPhone.is_on_biz_app ? 'SMB' : 'ENTERPRISE'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneStatus
                    key={'ps-' + selectedPhone.id}
                    phone={selectedPhone}
                    onRegisterClick={() => setOtpModalPhone(selectedPhone)}
                    onStatusChange={(newStatus) => handlePhoneStatusChange(selectedPhone.id, newStatus)}
                    externalStatus={phoneStatuses[selectedPhone.id]}
                  />
                  <AckBotStatus key={'ab-' + selectedPhone.id} phone={selectedPhone} />
                  <CallingStatus key={'cs-' + selectedPhone.id} phone={selectedPhone} />
                </div>
              </div>

              {/* Listening status bar */}
              <div
                className={cn(
                  'px-5 py-1.5 flex items-center gap-2 text-xs border-b flex-shrink-0',
                  ablyState === 'connected' && phoneStatuses[selectedPhone.id] === 'CONNECTED'
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                    : ablyState === 'failed'
                      ? 'bg-red-50 border-red-100 text-red-600'
                      : ablyState === 'disconnected'
                        ? 'bg-amber-50 border-amber-100 text-amber-700'
                        : 'bg-gray-50 border-gray-100 text-gray-500',
                )}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full flex-shrink-0',
                    ablyState === 'connected' && phoneStatuses[selectedPhone.id] === 'CONNECTED'
                      ? 'bg-emerald-500 animate-pulse'
                      : ablyState === 'failed'
                        ? 'bg-red-500'
                        : ablyState === 'disconnected'
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-gray-400 animate-pulse',
                  )}
                />
                {ablyState === 'failed'
                  ? 'Connection failed — please refresh'
                  : ablyState === 'disconnected'
                    ? 'Reconnecting…'
                    : ablyState !== 'connected'
                      ? 'Connecting…'
                      : phoneStatuses[selectedPhone.id] === 'CONNECTED'
                        ? `Listening for incoming messages on ${selectedPhone.display_phone_number}`
                        : 'Phone disconnected — click status to reconnect'}
              </div>

              {/* Call banner — shown for active calls or permission flow */}
              {((callState.state !== 'IDLE' && callState.phoneNumberId === selectedPhone.id)
                || permissionState !== 'none') && (
                <CallBanner
                  callState={callState}
                  callingClient={callingClientRef.current}
                  permissionState={permissionState}
                  onAccept={handleAcceptCall}
                  onReject={handleRejectCall}
                  onHangUp={handleHangUp}
                  onRequestPermission={handleRequestPermission}
                  onCallNow={handleCallNow}
                />
              )}

              {/* Chat list + conversation */}
              <div className="flex flex-1 min-h-0">
                {/* Chat list (only shown when there are conversations) */}
                {selectedPhone && Object.keys(allChats[selectedPhone.id] ?? {}).length > 0 && (
                  <div className="w-60 border-r border-gray-100 bg-white overflow-y-auto flex-shrink-0">
                    <div className="px-4 py-2.5 border-b border-gray-50">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Conversations</h3>
                    </div>
                    {Object.entries(allChats[selectedPhone.id] ?? {})
                      .sort(([, a], [, b]) => (b.lastTimestamp ?? 0) - (a.lastTimestamp ?? 0))
                      .map(([chatId, chat]) => {
                        const isUnread = unreadChats[selectedPhone.id]?.has(chatId) ?? false;
                        return (
                          <button
                            key={chatId}
                            onClick={() => {
                              setSelectedChatId(chatId);
                              markRead(selectedPhone.id, chatId);
                            }}
                            className={cn(
                              'w-full text-left flex items-center gap-3 px-4 py-3 border-b border-gray-50 transition-colors',
                              selectedChatId === chatId ? 'bg-indigo-50' : 'hover:bg-gray-50',
                            )}
                          >
                            <div className="relative flex-shrink-0">
                              <div
                                className={cn(
                                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                                  selectedChatId === chatId ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500',
                                )}
                              >
                                {chat.displayName.slice(0, 2).toUpperCase()}
                              </div>
                              {isUnread && (
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div
                                className={cn(
                                  'text-sm truncate',
                                  selectedChatId === chatId ? 'font-medium text-indigo-700' :
                                  isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700',
                                )}
                              >
                                {chat.displayName}
                              </div>
                              {chat.lastMessage && (
                                <div className={cn(
                                  'text-xs truncate mt-0.5',
                                  isUnread ? 'text-gray-600 font-medium' : 'text-gray-400',
                                )}>{chat.lastMessage}</div>
                              )}
                            </div>
                            {isUnread && (
                              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500" />
                            )}
                          </button>
                        );
                      })}
                  </div>
                )}

                {/* Conversation view */}
                <div className="flex-1 flex flex-col min-w-0">
                  {selectedChatId ? (
                    <ConversationView
                      chatId={selectedChatId}
                      displayName={allChats[selectedPhone.id]?.[selectedChatId]?.displayName ?? selectedChatId}
                      messages={allMessages[selectedPhone.id]?.[selectedChatId] ?? []}
                      onSendMessage={(text) => handleSendMessage(selectedPhone, selectedChatId, text)}
                      phoneDisplay={selectedPhone.display_phone_number}
                      isAckBotEnabled={selectedPhone.isAckBotEnabled}
                      onToggleAckBot={() => {}}
                      onCallClick={() => handleCallClick(selectedChatId)}
                      callActive={callState.state !== 'IDLE' || permissionState !== 'none'}
                    />
                  ) : (
                    <div
                      className="flex-1 flex flex-col items-center justify-center text-left px-6 bg-gradient-to-b from-[#f8f9ff] to-[#f1f3f9]"
                    >
                      <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">No Messages Yet</h3>
                      <p className="text-xs text-gray-400 max-w-xs">Messages appear here in real-time via webhooks.</p>
                      <p className="text-[11px] text-gray-300 mt-1">
                        Conversation history is not persisted — refreshing the page will clear messages.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div
              className="flex-1 flex flex-col items-center justify-center text-left px-6 bg-gradient-to-b from-[#f8f9ff] to-[#f1f3f9]"
            >
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">No Phone Selected</h3>
              <p className="text-xs text-gray-400">Choose a phone number from the left panel</p>
            </div>
          )}
        </div>
      </div>

      {/* OTP Registration Modal */}
      {otpModalPhone && (
        <PhoneRegistrationModal
          phone={{
            ...otpModalPhone,
            status: phoneStatuses[otpModalPhone.id] ?? otpModalPhone.status,
          }}
          onClose={() => setOtpModalPhone(null)}
          onRegistrationComplete={() => {
            handlePhoneStatusChange(otpModalPhone.id, 'CONNECTED');
          }}
        />
      )}
    </div>
  );
}
