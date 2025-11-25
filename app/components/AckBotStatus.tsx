"use client"

import { feGraphApiPostWrapper } from '@/app/fe_utils';
import { useState } from 'react';

export default function AckBotStatus({ phone }) {
    const [isAckBotEnabled, setIsAckBotEnabled] = useState(phone.isAckBotEnabled);
    const [isLoading, setIsLoading] = useState(false);

    function handleClick() {
        return feGraphApiPostWrapper(`/api/phones/${phone.id}`, { isAckBotEnabled: !isAckBotEnabled, phoneId: phone.id })
            .then(data => {
                console.log('data', data);
                setIsAckBotEnabled(!isAckBotEnabled);
            })
            .catch(error => {
                console.log('error', error);
            });
    }

    const onClickHandlerWrapper = () => {
        setIsLoading(true);
        handleClick().then(() => {
            setIsLoading(false);
        });
    }

    let content = <>...</>;
    if (!isLoading) {
        content = (
            <>
                {isAckBotEnabled ? 'AckBot Enabled' : 'AckBot Disabled'}
            </>
        );
    }

    const statusColor = isAckBotEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

    return (
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
            role="button"
            tabIndex={0}
        >
            {content}
        </div>
    );
};
