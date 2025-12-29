// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


export default function PhoneType({ phone }) {

    // Determine if the phone number is SMB or ENTERPRISE
    const phoneType = phone.is_on_biz_app ? "SMB" : "ENTERPRISE";
    const statusColor = phone.is_on_biz_app ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';

    return (
        <div
            className={`w-24 text-center rounded-md px-2 py-1 mr-1 text-xs 
                transition-all duration-200 ease-in-out
                border border-gray-200
                flex items-center justify-center
                ${statusColor}
                h-8`}
            role="status"
        >
            {phoneType}
        </div>
    );
};
