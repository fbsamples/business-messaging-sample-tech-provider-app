// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
'use client';
import type { PhoneDetails } from '@/app/types/api';

interface PhoneListSidebarProps {
  phones: PhoneDetails[];
  selectedPhoneId: string | null;
  onSelectPhone: (phone: PhoneDetails) => void;
}

export default function PhoneListSidebar({ phones, selectedPhoneId, onSelectPhone }: PhoneListSidebarProps) {
  return (
    <div className="w-72 bg-white border-r border-gray-100 flex flex-col h-full flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">My Phone Numbers</h2>
        <p className="text-xs text-gray-400 mt-0.5">Select a number to view messages</p>
      </div>
      {/* Phone List */}
      <div className="flex-1 overflow-y-auto">
        {phones.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500 font-medium">No phone numbers</p>
            <p className="text-xs text-gray-400 mt-1">Connect a WABA to see numbers here</p>
          </div>
        )}
        {phones.map((phone) => {
          const isSelected = selectedPhoneId === phone.id;
          const isSMB = phone.is_on_biz_app;
          return (
            <button
              key={phone.id}
              onClick={() => onSelectPhone(phone)}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-gray-50 transition-colors ${
                isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {phone.display_phone_number.replace(/\D/g, '').slice(-2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium truncate ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>
                    {phone.display_phone_number}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${
                      isSMB ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {isSMB ? 'SMB' : 'ENT'}
                  </span>
                </div>
              </div>
              {isSelected && <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
