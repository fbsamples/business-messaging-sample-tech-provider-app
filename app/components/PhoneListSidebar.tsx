// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

"use client";

import { PhoneDetails } from "@/app/types/api";

interface PhoneListSidebarProps {
    phones: PhoneDetails[];
    selectedPhoneId: string | null;
    onSelectPhone: (phone: PhoneDetails) => void;
}

export default function PhoneListSidebar({
    phones,
    selectedPhoneId,
    onSelectPhone,
}: PhoneListSidebarProps) {
    return (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">My Phone Numbers</h2>
                <p className="text-sm text-gray-500 mt-1">Select a number to view messages</p>
            </div>

            {/* Phone List */}
            <div className="flex-1 overflow-y-auto">
                {phones.map((phone) => {
                    const isSelected = selectedPhoneId === phone.id;
                    const phoneType = phone.is_on_biz_app ? "SMB app" : "ENTERPRISE";
                    const typeColor = phone.is_on_biz_app
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800";

                    return (
                        <div
                            key={phone.id}
                            onClick={() => onSelectPhone(phone)}
                            className={`p-3 border-b border-gray-100 cursor-pointer transition-colors duration-150 hover:bg-gray-50 ${
                                isSelected ? "bg-blue-50" : ""
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <span className="font-medium text-gray-900 text-sm truncate">
                                        {phone.display_phone_number}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${typeColor}`}>
                                        {phoneType}
                                    </span>
                                </div>
                                {isSelected && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 ml-2" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
