// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use client';

import { useEffect, useRef } from 'react';
import { SessionInfo } from '@/app/types/api';

declare const FB: any;

interface FBL4BLauncherProps {
    app_id: string;
    app_name: string;
    esConfig: string;
    onClickFbl4b: () => void;
    onBannerInfoChange: (info: string) => void;
    onLastEventDataChange: (data: unknown) => void;
    onSaveToken: (code: string, session_info: SessionInfo) => void;
    onQuickLaunch?: (fn: () => void) => void;
}

let session_info_outer: SessionInfo | null = null;
let code_outer: string | null = null;

export default function FBL4BLauncher({
    app_id,
    esConfig,
    onClickFbl4b,
    onBannerInfoChange,
    onLastEventDataChange,
    onSaveToken,
    onQuickLaunch,
}: FBL4BLauncherProps) {
    // Track whether the ES flow is in progress
    const esInProgress = useRef(false);
    const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Reference to the popup window opened by FB.login
    const popupWindowRef = useRef<Window | null>(null);

    const stopPolling = () => {
        if (pollTimerRef.current !== null) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }
    };

    const clearEsState = () => {
        esInProgress.current = false;
        popupWindowRef.current = null;
        stopPolling();
    };

    const fbLoginCallback = (response: { authResponse?: { code: string } }) => {
        clearEsState();
        if (response.authResponse) {
            const code = response.authResponse.code;
            code_outer = code;
            if (session_info_outer && code_outer) {
                onSaveToken(code_outer, session_info_outer);
            }
        } else {
            // User clicked Cancel on the FB login dialog itself
            onBannerInfoChange("");
            // Do NOT clear lastEventData on cancel — keep the last session event visible
        }
    };

    const launchWhatsAppSignup = () => {
        onClickFbl4b();
        if (typeof FB === 'undefined') {
            onBannerInfoChange("Facebook SDK is still loading. Please try again in a moment.");
            return;
        }
        const esConfigJson = JSON.parse(esConfig);
        onBannerInfoChange("ES Started...");
        onLastEventDataChange(null);
        session_info_outer = null;
        code_outer = null;
        esInProgress.current = true;
        popupWindowRef.current = null;

        // Capture the popup window reference opened by FB.login.
        // FB.login opens a popup synchronously before invoking the callback,
        // so we can grab it from window.open by briefly patching it.
        const originalWindowOpen = window.open;
        window.open = function (...args) {
            const popup = originalWindowOpen.apply(window, args);
            if (popup) {
                popupWindowRef.current = popup;
            }
            window.open = originalWindowOpen; // restore immediately
            return popup;
        };

        FB.login(fbLoginCallback, esConfigJson);

        // Poll every 500ms: if the popup window is closed and we haven't received
        // a proper fbLoginCallback yet, the user closed the window externally.
        stopPolling();
        pollTimerRef.current = setInterval(() => {
            if (!esInProgress.current) {
                stopPolling();
                return;
            }
            const popup = popupWindowRef.current;
            if (popup && popup.closed) {
                // Popup was closed without triggering fbLoginCallback
                clearEsState();
                onBannerInfoChange("");
            }
        }, 500);
    };

    // Register the launch function with the parent so Quick Launch can trigger it
    if (onQuickLaunch) { onQuickLaunch(launchWhatsAppSignup); }

    useEffect(() => {
        const initFB = () => {
            FB.init({
                appId: app_id,
                autoLogAppEvents: true,
                xfbml: true,
                version: 'v24.0'
            });
        };

        // If FB SDK is already loaded, init immediately
        if (typeof FB !== 'undefined') {
            initFB();
        } else {
            // Otherwise set the callback for when it loads
            window.fbAsyncInit = initFB;
        }

        const cb = (event: MessageEvent) => {
            if (!event.origin.endsWith('facebook.com')) return;
            try {
                const data = JSON.parse(event.data);
                onLastEventDataChange(data);
                if (data.type === 'WA_EMBEDDED_SIGNUP') {
                    if (data.data.current_step) {
                        // User closed the popup mid-flow — clear the "ES Started..." banner
                        clearEsState();
                        onBannerInfoChange('');
                    } else {
                        const session_info: SessionInfo = data;
                        session_info_outer = session_info;
                        if (session_info_outer && code_outer) {
                            onSaveToken(code_outer, session_info);
                        }
                    }
                }
            } catch (err) {
                // Non-ES message events from Facebook iframes are expected and can be ignored
            }
        };

        window.addEventListener('message', cb);

        return () => {
            window.removeEventListener('message', cb);
            stopPolling();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [app_id, onBannerInfoChange, onLastEventDataChange, onSaveToken]);

    return (
        <button
            onClick={launchWhatsAppSignup}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#1877F2] text-white text-sm font-semibold rounded-full hover:bg-[#1565C0] transition-all shadow-[0_4px_14px_rgba(24,119,242,0.4)] hover:shadow-[0_6px_20px_rgba(24,119,242,0.55)] hover:-translate-y-px"
        >
            Launch Embedded Signup
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
        </button>
    );
}
