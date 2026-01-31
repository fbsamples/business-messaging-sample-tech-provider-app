// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


"use client"

import { feGraphApiPostWrapper } from '@/app/fe_utils';
import { useState } from 'react';

export default function PhoneStatus({ phone }) {

    const [status, setStatus] = useState(phone.status);
    const [isLoading, setIsLoading] = useState(false);
    const [codeVerificationStatus, setCodeVerificationStatus] = useState(phone.code_verification_status);
    const [otpCode, setOtpCode] = useState('');
    const [showTooltip, setShowTooltip] = useState(false);

    let tooltipMsg = null;
    let onClickHandler = () => new Promise(() => { })

    if (status === 'DISCONNECTED' && (codeVerificationStatus === "NOT_VERIFIED" || codeVerificationStatus === "EXPIRED")) {
        tooltipMsg = "Click to request code";
        onClickHandler = () => feGraphApiPostWrapper(`/api/request_code`, {
            waba_id: phone.wabaId,
            phone_number_id: phone.id,
        })
            .then(() => {
                setStatus('SENT');
            });
    }
    else if (status === 'SENT') {
        tooltipMsg = "Hit enter to verify code";
        onClickHandler = () => feGraphApiPostWrapper(`/api/verify_code`, {
            wabaId: phone.wabaId,
            phoneId: phone.id,
            otpCode: otpCode,
        })
            .then(() => {
                setCodeVerificationStatus('VERIFIED');
                setStatus('PENDING');
            });
    }
    else if (status === 'DISCONNECTED' && codeVerificationStatus === "VERIFIED") {
        tooltipMsg = "Click to register";
        onClickHandler = () => feGraphApiPostWrapper(`/api/register`, {
            wabaId: phone.wabaId,
            phoneId: phone.id,
        }).then(() => {
            setStatus('CONNECTED');
        });
    }
    else if (status === 'PENDING' && codeVerificationStatus === "VERIFIED") {
        tooltipMsg = "Click to register";
        onClickHandler = () => feGraphApiPostWrapper(`/api/register`, {
            wabaId: phone.wabaId,
            phoneId: phone.id,
        }).then(() => {
            setStatus('CONNECTED');
        });
    }
    else if (status === 'CONNECTED') {
        tooltipMsg = "Click to disconnect";
        onClickHandler = () => feGraphApiPostWrapper(`/api/deregister`, {
            wabaId: phone.wabaId,
            phoneId: phone.id,
        }).then(() => {
            setStatus('DISCONNECTED');
        });
    }

    const onClickHandlerWrapper = () => {
        setIsLoading(true);
        onClickHandler().then(() => {
            setIsLoading(false);
        });
    }

    const onChangeWrapper = (e) => {
        setOtpCode(e.target.value);
    };

    const onKeyDownHandler = (e) => {
        if (e.key === 'Enter') {
            onClickHandlerWrapper();
        }
    };

    const otpInput = (
        <input
            type="text"
            className='w-16 pl-1 bg-transparent border-b border-gray-300 focus:border-gray-500 focus:outline-hidden'
            value={otpCode}
            onChange={onChangeWrapper}
            placeholder="Enter code"
        />
    )

    let content = <>...</>;
    if (!isLoading) {
        content = (
            <div className="flex items-center gap-1">
                <span className="font-medium">{status}</span>
                {status === 'SENT' && otpInput}
            </div>
        );
    }

    const statusColor = status === 'CONNECTED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

    return (
        <>
            <div className="relative">
                <div
                    className={`w-24 text-center rounded-md px-2 py-1 mr-1 text-xs
                    cursor-pointer transition-all duration-200 ease-in-out
                    hover:shadow-md hover:scale-105 active:scale-95
                    border border-gray-200 hover:border-gray-300
                    flex items-center justify-center
                    ${isLoading ? 'opacity-70' : 'opacity-100'}
                    ${statusColor}
                    h-8`}
                    onClick={onClickHandlerWrapper}
                    onKeyDown={onKeyDownHandler}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onFocus={() => setShowTooltip(true)}
                    onBlur={() => setShowTooltip(false)}
                    role="button"
                    tabIndex={0}
                >
                    {content}
                </div>
                {showTooltip && tooltipMsg && (
                    <div className="absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap
                    -top-8 left-1/2 transform -translate-x-1/2
                    transition-opacity duration-75 ease-in-out">
                        {tooltipMsg}
                        <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
                    </div>
                )}
            </div>
        </>
    );
};
