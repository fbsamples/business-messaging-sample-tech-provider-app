// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


"use client"

import { useState } from 'react';
import LivePhones from '@/app/components/LivePhones';
import PhoneStatus from '@/app/components/PhoneStatus';
import AckBotStatus from '@/app/components/AckBotStatus';
import PhoneType from '@/app/components/PhoneType';

export default function InboxLayout({ phones }) {
    const [selectedPhone, setSelectedPhone] = useState(phones.length > 0 ? phones[0] : null);

    const handlePhoneSelect = (phone) => {
        setSelectedPhone(phone);
    };

    const phone_data = selectedPhone ? {
        phone_id: selectedPhone.id,
        phone_display: selectedPhone.display_phone_number,
        wabaId: selectedPhone.wabaId,
        details: selectedPhone
    } : null;

    return (
        <div className="flex w-full h-full bg-gray-50">
            {/* Left Sidebar - Phone Selection */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">My Phone Numbers</h2>
                    <p className="text-sm text-gray-500 mt-1">Select a number to view messages</p>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {phones.map((phone) => (
                        <div
                            key={phone.id}
                            onClick={() => handlePhoneSelect(phone)}
                            className={`p-4 border-b border-gray-100 cursor-pointer transition-colors duration-150 hover:bg-gray-50 ${selectedPhone?.id === phone.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 truncate">
                                        {phone.display_phone_number}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        {phone.is_on_biz_app ? "SMB" : "ENTERPRISE"}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${phone.is_on_biz_app ? 'bg-purple-400' : 'bg-blue-400'
                                        }`}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Details Pane */}
            <div className="flex-1 flex flex-col">
                {selectedPhone ? (
                    <>
                        {/* Phone Details Header */}
                        <div className="bg-white border-b border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {selectedPhone.display_phone_number}
                                    </h1>
                                    <p className="text-gray-500 mt-1">
                                        WhatsApp Business Account
                                    </p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <PhoneStatus key={'phone-status-' + selectedPhone.id} phone={selectedPhone} />
                                    <AckBotStatus key={'ack-bot-status-' + selectedPhone.id} phone={selectedPhone} />
                                    <PhoneType key={'phone-type-' + selectedPhone.id} phone={selectedPhone} />
                                </div>
                            </div>
                        </div>

                        {/* Chat History */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            <LivePhones
                                key={'live-phones-' + selectedPhone.id}
                                phone_number_id={phone_data.phone_id}
                                phone_display={phone_data.phone_display}
                                wabaId={phone_data.wabaId}
                                _phone_details={phone_data.details}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-gray-400 text-6xl mb-4">📱</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Phone Selected</h3>
                            <p className="text-gray-500">Choose a phone number from the left sidebar to view messages</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
