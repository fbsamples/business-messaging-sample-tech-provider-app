// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use client';

import { useEffect } from 'react';
import TpButton from '@/app/components/Button';
import { SessionInfo } from '@/app/types/api';

declare const FB: any;

interface FBL4BLauncherProps {
    app_id: string;
    app_name: string;
    esConfig: string;
    onClickFbl4b: () => void;
    onBannerInfoChange: (info: string) => void;
    onLastEventDataChange: (data: any) => void;
    onSaveToken: (code: string, session_info: SessionInfo) => void;
}

let session_info_outer: SessionInfo | null = null;
let code_outer: string | null = null;

export default function FBL4BLauncher({
    app_id,
    app_name,
    esConfig,
    onClickFbl4b,
    onBannerInfoChange,
    onLastEventDataChange,
    onSaveToken,
}: FBL4BLauncherProps) {

    const fbLoginCallback = (response: any) => {
        if (response.authResponse) {
            const code = response.authResponse.code;
            code_outer = code;
            if (session_info_outer && code_outer) {
                onSaveToken(code_outer, session_info_outer);
            }
        }
    };

    const launchWhatsAppSignup = () => {
        onClickFbl4b();
        const esConfigJson = JSON.parse(esConfig);
        onBannerInfoChange("ES Started...");
        FB.login(fbLoginCallback, esConfigJson);
    };

    useEffect(() => {
        window.fbAsyncInit = function () {
            FB.init({
                appId: app_id,
                autoLogAppEvents: true,
                xfbml: true,
                version: 'v24.0'
            });
        };

        const cb = (event: MessageEvent) => {
            if (!event.origin.endsWith('facebook.com')) return;
            try {
                const data = JSON.parse(event.data);
                onLastEventDataChange(data);
                console.log("=== ES DATA ===");
                console.log(data);
                if (data.type === 'WA_EMBEDDED_SIGNUP') {
                    if (data.data.current_step) {
                        onBannerInfoChange('ES Exited Early\n' + JSON.stringify(data.data, null, 2));
                        console.log('=== Exited Early ===');
                        console.log(data.data);
                    } else {
                        const session_info: SessionInfo = data;
                        session_info_outer = session_info;
                        console.log('=== message session version ===\n', 'code_outer: ', code_outer, '\nsession_info_outer:', session_info_outer);
                        if (session_info_outer && code_outer) {
                            onSaveToken(code_outer, session_info);
                        }
                    }
                }
            } catch (err) {
                // console.log('=== catch triggered ===', event, err);
                // this is not an event that we are intereted in sincee JSON.parse(event.data) threw an exception
            }
        };

        window.addEventListener('message', cb);

        return () => {
            window.removeEventListener('message', cb);
        };
    }, [app_id, onBannerInfoChange, onLastEventDataChange, onSaveToken]);

    return (
            <TpButton
                onClick={launchWhatsAppSignup}
                title="Launch FBL4B"
                subtitle={`Share your Meta assets with ${app_name}`}
            />

    );
}
