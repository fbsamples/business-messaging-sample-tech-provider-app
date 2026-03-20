// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use client';

import {feGraphApiPostWrapper} from '@/app/fe_utils';
import {useState, useEffect} from 'react';

export default function PhoneStatus({
  phone,
  onRegisterClick,
  onStatusChange,
  externalStatus,
}: {
  phone: any;
  onRegisterClick?: () => void;
  onStatusChange?: (newStatus: string) => void;
  externalStatus?: string;
}) {
  const [status, setStatus] = useState(phone.status);

  useEffect(() => {
    if (externalStatus && externalStatus !== status) {
      setStatus(externalStatus);
    }
  }, [externalStatus]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  let tooltipMsg = null;

  if (status === 'CONNECTED') {
    tooltipMsg = 'Click to disconnect';
  } else if (status === 'DISCONNECTED' && phone.code_verification_status === 'VERIFIED') {
    tooltipMsg = 'Click to reconnect';
  } else if (status === 'DISCONNECTED') {
    tooltipMsg = 'Click to register';
  } else {
    tooltipMsg = `Status: ${status}`;
  }

  const onClickHandlerWrapper = () => {
    if (status === 'CONNECTED') {
      setIsLoading(true);
      feGraphApiPostWrapper(`/api/deregister`, {
        wabaId: phone.wabaId,
        phoneId: phone.id,
      })
        .then(() => {
          setStatus('DISCONNECTED');
          onStatusChange?.('DISCONNECTED');
        })
        .catch(error => {
          console.error('Failed to deregister phone:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      onRegisterClick?.();
    }
  };

  const content = isLoading ? (
    <div className="flex items-center gap-1">
      <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span className="font-medium">
        {status === 'CONNECTED' ? 'Disconnecting' : 'Connecting'}
      </span>
    </div>
  ) : (
    <div className="flex items-center gap-1">
      <span className="font-medium">{status}</span>
    </div>
  );

  const statusColor =
    status === 'CONNECTED'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';

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
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
          role="button"
          tabIndex={0}>
          {content}
        </div>
        {showTooltip && tooltipMsg && (
          <div
            className="absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap
                    -top-8 left-1/2 transform -translate-x-1/2
                    transition-opacity duration-75 ease-in-out">
            {tooltipMsg}
            <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
          </div>
        )}
      </div>
    </>
  );
}
