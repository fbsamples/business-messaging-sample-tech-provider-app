// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use client';

import { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { formatErrors } from '@/app/errorformat';
import { feGraphApiPostWrapper } from '@/app/fe_utils';
import FBL4BLauncher from '@/app/components/Fbl4bLauncher';
import { SessionInfo } from '@/app/types/api';

function Tip({ text, children }: { text: string; children: React.ReactNode }) {
    return (
        <span className="relative group/tip inline-flex items-center">
            {children}
            <span className="pointer-events-none invisible opacity-0 group-hover/tip:visible group-hover/tip:opacity-100 transition-opacity absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-[11px] leading-relaxed text-white bg-black rounded-lg shadow-xl whitespace-normal max-w-[220px] text-center">
                {text}
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
            </span>
        </span>
    );
}

function HelpDot({ tip }: { tip: string }) {
    return (
        <Tip text={tip}>
            <span className="ml-1.5 w-4 h-4 inline-flex items-center justify-center rounded-full text-[10px] font-medium text-gray-400 border border-gray-300 cursor-help hover:text-gray-600 hover:border-gray-400 transition-colors">?</span>
        </Tip>
    );
}

function Toggle({ checked, onChange, label, tip }: { checked: boolean; onChange: (v: boolean) => void; label: string; tip: string }) {
    return (
        <label className="flex items-center gap-2.5 cursor-pointer group/toggle">
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-black' : 'bg-gray-200'}`}
            >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-[13px] text-gray-600 group-hover/toggle:text-gray-900 transition-colors">{label}</span>
            <HelpDot tip={tip} />
        </label>
    );
}

export default function ClientDashboard({ app_id, app_name, bm_id, user_id, tp_configs, public_es_feature_options: _public_es_feature_options, public_es_versions, public_es_feature_types, es_prefilled_setup }) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const updateUrlParams = (updates) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
                params.delete(key);
            } else if (Array.isArray(value)) {
                params.set(key, value.join(','));
            } else {
                params.set(key, value.toString());
            }
        });
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    const parseUrlParams = () => {
        const esVersion = searchParams.get('esVersion') || public_es_versions[0];
        const esFeatureType = searchParams.get('esFeatureType') || '';
        const esFeatures = searchParams.get('esFeatures') ? searchParams.get('esFeatures').split(',') : [];
        const tpConfig = searchParams.get('tpConfig') || tp_configs[0].id;
        return { esVersion, esFeatureType, esFeatures, tpConfig };
    };

    const { esVersion: initialEsVersion, esFeatureType: initialEsFeatureType, esFeatures: initialEsFeatures, tpConfig: initialTpConfig } = parseUrlParams();

    const [esOptionFeatureType, setEsOptionFeatureType] = useState(initialEsFeatureType);
    const [esOptionFeatures, setEsOptionFeatures] = useState(initialEsFeatures);
    const [esOptionConfig, setEsOptionConfig] = useState(initialTpConfig);
    const [esOptionVersion, setEsOptionVersion] = useState(initialEsVersion);
    const [esOptionPrefilled, setEsOptionPrefilled] = useState(false);
    const [es_option_reg, setEs_option_reg] = useState(true);
    const [es_option_sub, setEs_option_sub] = useState(true);

    const computeEsConfig = (ft, cfg, feats, ver, pf) => {
        const c: any = {
            config_id: cfg, response_type: 'code', override_default_response_type: true,
            extras: { sessionInfoVersion: '3', version: ver, featureType: ft,
                features: feats ? feats.map((f) => ({ name: f })) : null }
        };
        if (ft === '') delete c.extras.featureType;
        if (pf) c.setup = es_prefilled_setup;
        return c;
    };

    const [esConfig, setEsConfig] = useState(JSON.stringify(computeEsConfig(esOptionFeatureType, esOptionConfig, esOptionFeatures, esOptionVersion, esOptionPrefilled), null, 2));
    const [bannerInfo, setBannerInfo] = useState("");
    const [lastEventData, setLastEventData] = useState(null);

    const recomputeJson = (ft, cfg, feats, ver, pf) =>
        setEsConfig(JSON.stringify(computeEsConfig(ft, cfg, feats, ver, pf), null, 2));

    const handleBannerInfoChange = useCallback((info: string) => setBannerInfo(info), []);
    const handleLastEventDataChange = useCallback((data: any) => setLastEventData(data), []);

    const handleSaveToken = useCallback((code: string, session_info: SessionInfo) => {
        setBannerInfo('Setting up WABA...');
        const { waba_id, business_id, phone_number_id, page_ids, ad_account_ids, catalog_ids, dataset_ids, instagram_account_ids } = session_info.data;
        feGraphApiPostWrapper('/api/token', {
            code, app_id, waba_id, waba_ids: waba_id ? [waba_id] : [],
            business_id, phone_number_id,
            page_ids: page_ids || [], ad_account_ids: ad_account_ids || [],
            dataset_ids: dataset_ids || [], catalog_ids: catalog_ids || [],
            instagram_account_ids: instagram_account_ids || [],
            es_option_reg, es_option_sub, user_id
        }).then(d => setBannerInfo("WABA Setup Finished\n" + formatErrors(d) + '\n'));
    }, [app_id, es_option_reg, es_option_sub, user_id]);

    const handleClickFbl4b = useCallback(() => {
        fetch('/api/log', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id, action: 'launch_fbl4b' }) });
    }, [user_id]);

    const setFt = (v) => { if (v === 'only_waba_sharing') setEs_option_reg(false); setEsOptionFeatureType(v); updateUrlParams({ esFeatureType: v }); recomputeJson(v, esOptionConfig, esOptionFeatures, esOptionVersion, esOptionPrefilled); };
    const setCfg = (v) => { setEsOptionConfig(v); updateUrlParams({ tpConfig: v }); recomputeJson(esOptionFeatureType, v, esOptionFeatures, esOptionVersion, esOptionPrefilled); };
    const setReg = (v) => { if (v && esOptionFeatureType === 'only_waba_sharing') setFt(""); setEs_option_reg(v); };
    const setVer = (v) => { setEsOptionVersion(v); updateUrlParams({ esVersion: v }); recomputeJson(esOptionFeatureType, esOptionConfig, esOptionFeatures, v, esOptionPrefilled); };
    const setPf = (v) => { setEsOptionPrefilled(v); recomputeJson(esOptionFeatureType, esOptionConfig, esOptionFeatures, esOptionVersion, v); };
    const setFeats = (e) => { const f = e.target.value.split(',').map(s => s.trim()).filter(Boolean); setEsOptionFeatures(f); updateUrlParams({ esFeatures: f }); recomputeJson(esOptionFeatureType, esOptionConfig, f, esOptionVersion, esOptionPrefilled); };

    return (
        <div className="px-8 py-6 max-w-[1100px] mx-auto">
            {/* Minimal metadata line */}
            <div className="flex items-center gap-3 text-[12px] text-gray-400 mb-8">
                <a target="_blank" href={`https://developers.facebook.com/apps/${app_id}`} className="hover:text-gray-600 transition-colors font-mono">App {app_id}</a>
                <span>/</span>
                <a target="_blank" href={`https://business.facebook.com/latest/settings/whatsapp_account?business_id=${bm_id}`} className="hover:text-gray-600 transition-colors font-mono">Business {bm_id}</a>
            </div>

            <div className="grid grid-cols-[1fr_340px] gap-10">
                {/* Left column */}
                <div className="space-y-10">
                    {/* Section: Configuration */}
                    <section>
                        <h2 className="text-[20px] font-semibold text-gray-900 tracking-tight mb-1">Configuration</h2>
                        <p className="text-[13px] text-gray-400 mb-6">Set up the Embedded Signup parameters. The payload updates live as you change options.</p>

                        <div className="space-y-6">
                            {/* TP Config */}
                            <div>
                                <label className="flex items-center text-[13px] font-medium text-gray-900 mb-2">
                                    Provider Config <HelpDot tip="Select which Tech Provider configuration to use. Each config maps to a different setup in Meta's system." />
                                </label>
                                <select value={esOptionConfig} onChange={(e) => setCfg(e.target.value)}
                                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-colors">
                                    {tp_configs.map((config) => (
                                        <option key={config.id} value={config.id}>{config.name} ({config.id})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Version + Feature Type */}
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="flex items-center text-[13px] font-medium text-gray-900 mb-2">
                                        Version <HelpDot tip="v2 for production, v3 for new integrations, preview versions for testing." />
                                    </label>
                                    <select value={esOptionVersion} onChange={(e) => setVer(e.target.value)}
                                        className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-colors">
                                        {public_es_versions.map((v) => (
                                            <option key={v} value={v}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="flex items-center text-[13px] font-medium text-gray-900 mb-2">
                                        Feature Type <HelpDot tip="whatsapp_business_app_onboarding for full onboarding, only_waba_sharing for WABA sharing only." />
                                    </label>
                                    <select value={esOptionFeatureType} onChange={(e) => setFt(e.target.value)}
                                        className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-colors">
                                        <option value="">None</option>
                                        {public_es_feature_types[esOptionVersion].map((ft) => (
                                            <option key={ft} value={ft}>{ft}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Features */}
                            <div>
                                <label className="flex items-center text-[13px] font-medium text-gray-900 mb-2">
                                    Features <HelpDot tip="Comma-separated feature flags (e.g. marketing_messages_lite). Leave empty for defaults." />
                                </label>
                                <input type="text" value={esOptionFeatures.join(', ')} onChange={setFeats}
                                    placeholder="e.g. marketing_messages_lite"
                                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-colors" />
                            </div>

                            {/* Toggles */}
                            <div className="flex flex-wrap gap-x-6 gap-y-3 pt-4 border-t border-gray-100">
                                <Toggle checked={esOptionPrefilled} onChange={setPf} label="Pre-fill info" tip="Pre-populate the signup form with sample business data for testing." />
                                <Toggle checked={es_option_reg} onChange={setReg} label="Auto-register" tip="Automatically register the phone number after onboarding completes." />
                                <Toggle checked={es_option_sub} onChange={(v) => setEs_option_sub(v)} label="Auto-subscribe" tip="Subscribe to webhooks after onboarding. Required for incoming messages." />
                            </div>
                        </div>
                    </section>

                    {/* Section: Generated Payload */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wider">Generated Payload</h2>
                            <span className="text-[11px] text-gray-400">passed to FB.login()</span>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-gray-800">
                            <div className="bg-[#0a0a0a] px-5 py-4">
                                <pre className="text-[12px] leading-relaxed text-emerald-400 font-mono whitespace-pre-wrap">{esConfig}</pre>
                            </div>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2">
                            This JSON is generated from the configuration above and sent to <code className="text-[11px] font-mono text-gray-500">FB.login(callback, payload)</code> when you launch the flow.
                        </p>
                    </section>
                </div>

                {/* Right column */}
                <div className="space-y-6">
                    {/* Launch */}
                    <div className="sticky top-20">
                        <div className="mb-6">
                            <h2 className="text-[20px] font-semibold text-gray-900 tracking-tight mb-1">Launch</h2>
                            <p className="text-[13px] text-gray-400">Start the Embedded Signup flow with your current configuration.</p>
                        </div>

                        <div className="mb-6">
                            <FBL4BLauncher
                                app_id={app_id}
                                app_name={app_name}
                                esConfig={esConfig}
                                onClickFbl4b={handleClickFbl4b}
                                onBannerInfoChange={handleBannerInfoChange}
                                onLastEventDataChange={handleLastEventDataChange}
                                onSaveToken={handleSaveToken}
                            />
                        </div>

                        {/* Response */}
                        <div>
                            <h3 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wider mb-3">Response</h3>

                            {bannerInfo || lastEventData ? (
                                <div className="space-y-3">
                                    {bannerInfo && (
                                        <div className={`text-[12px] px-4 py-3 rounded-lg font-mono leading-relaxed ${
                                            bannerInfo.includes('Finished') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                            bannerInfo.includes('Error') || bannerInfo.includes('Exited') ? 'bg-red-50 text-red-600 border border-red-200' :
                                            'bg-sky-50 text-sky-700 border border-sky-200'
                                        }`}>
                                            <pre className="whitespace-pre-wrap">{bannerInfo}</pre>
                                        </div>
                                    )}
                                    {lastEventData && (
                                        <div>
                                            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Session Event</div>
                                            <div className="bg-[#0a0a0a] rounded-lg p-4 overflow-auto max-h-52 border border-gray-800">
                                                <pre className="text-[11px] text-emerald-400 font-mono whitespace-pre-wrap leading-relaxed">{JSON.stringify(lastEventData, null, 2)}</pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="border border-dashed border-gray-200 rounded-xl py-8 text-center">
                                    <p className="text-[13px] text-gray-300">No response yet</p>
                                    <p className="text-[11px] text-gray-300 mt-0.5">Results appear here after launching</p>
                                </div>
                            )}

                            <div className="flex gap-4 mt-4">
                                <a href="https://developers.facebook.com/docs/whatsapp/embedded-signup/implementation#response-callback"
                                   target="_blank" rel="noopener noreferrer"
                                   className="text-[11px] text-gray-400 hover:text-gray-900 transition-colors underline underline-offset-2 decoration-gray-300 hover:decoration-gray-900">
                                    Response Callback
                                </a>
                                <a href="https://developers.facebook.com/docs/whatsapp/embedded-signup/implementation#session-logging-message-event-listener"
                                   target="_blank" rel="noopener noreferrer"
                                   className="text-[11px] text-gray-400 hover:text-gray-900 transition-colors underline underline-offset-2 decoration-gray-300 hover:decoration-gray-900">
                                    Session Events
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
