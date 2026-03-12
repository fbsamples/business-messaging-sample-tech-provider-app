// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use client';

import { useEffect } from 'react';
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
    app_name: _app_name,
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
            } catch (_err) {
                // this is not an event that we are interested in since JSON.parse(event.data) threw an exception
            }
        };

        window.addEventListener('message', cb);

        return () => {
            window.removeEventListener('message', cb);
        };
    }, [app_id, onBannerInfoChange, onLastEventDataChange, onSaveToken]);

    return (
        <button
            onClick={launchWhatsAppSignup}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#1877F2] text-white text-sm font-medium rounded-lg hover:bg-[#166FE5] transition-colors"
        >
            Launch Embedded Signup
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
        </button>
    );
}
