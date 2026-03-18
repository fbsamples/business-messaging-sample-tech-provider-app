// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import Ably from 'ably';
import PhoneListSidebar from './PhoneListSidebar';
import ConversationView, { type Message } from './ConversationView';
import PhoneRegistrationModal from './PhoneRegistrationModal';
import PhoneStatus from './PhoneStatus';
import AckBotStatus from './AckBotStatus';
import { type PhoneDetails } from '@/app/types/api';

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

    // OTP modal state
    const [otpModalPhone, setOtpModalPhone] = useState<PhoneDetails | null>(null);

    // Ably connection status
    const [isAblyConnected, setIsAblyConnected] = useState(false);

    // Refs for Ably callback access to latest state without re-subscribing
    const selectedPhoneRef = useRef(selectedPhone);
    const selectedChatIdRef = useRef(selectedChatId);
    useEffect(() => { selectedPhoneRef.current = selectedPhone; }, [selectedPhone]);
    useEffect(() => { selectedChatIdRef.current = selectedChatId; }, [selectedChatId]);

    // State management functions
    const addMessage = useCallback((phoneId: string, chatId: string, message: Message) => {
        setAllMessages(prev => {
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

    const addChat = useCallback((phoneId: string, chatId: string, displayName: string, lastMessage?: string) => {
        setAllChats(prev => {
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
    const handleSendMessage = useCallback((phone: PhoneDetails, chatId: string, text: string) => {
        addMessage(phone.id, chatId, { text, direction: "outgoing", timestamp: Date.now() });
        addChat(phone.id, chatId, allChats[phone.id]?.[chatId]?.displayName ?? chatId, text);

        fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                waba_id: phone.wabaId,
                phone_number_id: phone.id,
                dest_phone: chatId,
                message_content: text,
            }),
        }).catch(console.error);
    }, [addMessage, addChat, allChats]);

    // Ably connection — single connection for ALL phones
    useEffect(() => {
        const ablyClient = new Ably.Realtime({
            authCallback: async (_tokenParams, callback) => {
                fetch("/api/ably_auth")
                    .then(res => res.json())
                    .then(tokenRequest => callback(null, tokenRequest))
                    .catch(error => callback(error, null));
            },
        });

        ablyClient.connection.once("connected", () => {
            console.log("Connected to Ably!");
            setIsAblyConnected(true);
        });

        ablyClient.connection.on("disconnected", () => {
            setIsAblyConnected(false);
        });

        const channel = ablyClient.channels.get("get-started");
        channel.subscribe("first", (message) => {
            // Handle incoming messages
            const text = message.data.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;
            if (text) {
                const phoneId = message.data.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
                const consumerPhone = message.data.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
                const displayName = message.data.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name;
                const msgTimestamp = message.data.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.timestamp;

                addMessage(phoneId, consumerPhone, {
                    text,
                    direction: "incoming",
                    timestamp: msgTimestamp ? msgTimestamp * 1000 : Date.now(),
                });
                addChat(phoneId, consumerPhone, displayName ?? consumerPhone, text);

                // Auto-select first incoming chat if no chat is selected
                if (phoneId === selectedPhoneRef.current?.id && !selectedChatIdRef.current) {
                    setSelectedChatId(consumerPhone);
                }
            }

            // Handle message echoes (sent message confirmations)
            // Don't add duplicate — the optimistic send already added it
        });

        return () => {
            ablyClient.close();
        };
    }, [addMessage, addChat]);

    const isConnected = (phone: PhoneDetails) =>
        phone.code_verification_status === "VERIFIED" && phone.status === "CONNECTED";

    const phoneType = (phone: PhoneDetails) => phone.is_on_biz_app ? "SMB app" : "ENTERPRISE";

    return (
        <div className="flex flex-col w-full h-full min-h-full bg-gray-50">
            {/* Channel Tabs */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-center gap-2">
                <button
                    onClick={() => setActiveChannel('whatsapp')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        activeChannel === 'whatsapp'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 hover:bg-gray-100'
                    }`}
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                </button>
                <button
                    disabled
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-400 cursor-not-allowed"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259L10.732 8.2l3.131 3.259L19.752 8.2l-6.559 6.763z"/>
                    </svg>
                    Messenger
                </button>
                <button
                    disabled
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-400 cursor-not-allowed"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                    Instagram
                </button>
            </div>

            {/* Main 2-panel layout */}
            <div className="flex flex-1 min-h-0">
                {/* Left: Phone list sidebar */}
                <PhoneListSidebar
                    phones={phones}
                    selectedPhoneId={selectedPhone?.id ?? null}
                    onSelectPhone={setSelectedPhone}
                    onRegisterPhone={(phone) => setOtpModalPhone(phone)}
                />

                {/* Right: Conversation area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {selectedPhone ? (
                        <>
                            {/* Conversation header with phone details */}
                            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                <div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {selectedPhone.display_phone_number}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm text-gray-500">WhatsApp Business Account</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                            selectedPhone.is_on_biz_app
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {phoneType(selectedPhone)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <PhoneStatus
                                        key={'ps-' + selectedPhone.id}
                                        phone={selectedPhone}
                                        onRegisterClick={() => setOtpModalPhone(selectedPhone)}
                                    />
                                    <AckBotStatus key={'ab-' + selectedPhone.id} phone={selectedPhone} />
                                </div>
                            </div>

                            {/* Listening indicator */}
                            <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-center">
                                <div className={`w-2 h-2 rounded-full mr-2 ${isAblyConnected ? 'bg-blue-400 animate-pulse' : 'bg-gray-400'}`} />
                                <span className="text-blue-700 text-xs">
                                    {isAblyConnected
                                        ? `Listening for incoming messages on ${selectedPhone.display_phone_number}`
                                        : 'Connecting...'}
                                </span>
                            </div>

                            {/* Chat area */}
                            {selectedChatId ? (
                                <ConversationView
                                    chatId={selectedChatId}
                                    displayName={allChats[selectedPhone.id]?.[selectedChatId]?.displayName ?? selectedChatId}
                                    messages={allMessages[selectedPhone.id]?.[selectedChatId] ?? []}
                                    onSendMessage={(text) => handleSendMessage(selectedPhone, selectedChatId, text)}
                                    phoneDisplay={selectedPhone.display_phone_number}
                                    isAckBotEnabled={selectedPhone.isAckBotEnabled}
                                    onToggleAckBot={() => {}}
                                />
                            ) : (
                                /* No Messages Yet empty state */
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <svg className="mx-auto mb-4 w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Messages Yet</h3>
                                        <p className="text-gray-500 text-sm">Waiting for incoming messages on this phone number</p>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <svg className="mx-auto mb-4 w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Phone Selected</h3>
                                <p className="text-gray-500 text-sm">Choose a phone number from the sidebar</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* OTP Registration Modal */}
            {otpModalPhone && (
                <PhoneRegistrationModal
                    phone={otpModalPhone}
                    onClose={() => setOtpModalPhone(null)}
                />
            )}
        </div>
    );
}
