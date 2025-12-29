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

export default function PhoneNumbers({ phones }) {
    const [myPhone, setMyPhone] = useState(null);

    const setMyPhoneWrapper = (phone_data) => {
        return () => {
            setMyPhone(phone_data);
        }
    }

    const phone_list = phones.map((phone, _index) => {
        const phone_data = {
            phone_id: phone.id,
            phone_display: phone.display_phone_number,
            wabaId: phone.wabaId,
            details: phone
        }

        const color = (myPhone?.phone_id === phone.id) ? 'bg-neutral-800/30' : 'bg-gray-200';

        return (

            <div key={phone.id} >
                <div>
                    <div className={`rounded-lg px-1 py-1 mb-4 cursor-default`}>

                        <div onClick={setMyPhoneWrapper(phone_data)} className={`w-49 text-center rounded-lg p-1 pl-2 mb-1 hover:bg-neutral-800/30 ${color} h-8 flex items-center`}>
                            {phone.display_phone_number}
                        </div>
                        <div className='flex mb-1 items-center'>
                            <PhoneStatus phone={phone} />
                            <AckBotStatus phone={phone} />
                            <PhoneType phone={phone} />
                        </div>

                    </div>
                </div>
            </div>

        );
    });

    return (
        <div className="flex justify-left p-4">
            <div className='mr-8'>
                My Numbers:
                <br />
                <br />
                {phone_list}
            </div>
            <div>
                {myPhone && <LivePhones phone_number_id={myPhone.phone_id} phone_display={myPhone.phone_display} wabaId={myPhone.wabaId} _phone_details={myPhone.details} />}
            </div >
        </div >
    );

};
