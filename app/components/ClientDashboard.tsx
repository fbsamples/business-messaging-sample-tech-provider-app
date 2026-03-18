// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use client';

import { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { formatErrors } from '@/app/errorformat';
import BspBanner from '@/app/components/BspBanner';
import { feGraphApiPostWrapper } from '@/app/fe_utils';
import FBL4BLauncher from '@/app/components/Fbl4bLauncher';
import { SessionInfo } from '@/app/types/api';

// Info icon component for tooltips
function InfoIcon() {
    return (
        <svg className="w-4 h-4 text-gray-400 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth={2} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-4m0-4h.01" />
        </svg>
    );
}

export default function ClientDashboard({ app_id, app_name, bm_id, user_id, tp_configs, public_es_feature_options: _public_es_feature_options, public_es_versions, public_es_feature_types, es_prefilled_setup }) {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Helper function to update URL parameters
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

    // Helper function to parse URL parameters
    const parseUrlParams = () => {
        const esVersion = searchParams.get('esVersion') || public_es_versions[0];
        const esFeatureType = searchParams.get('esFeatureType') || '';
        const esFeatures = searchParams.get('esFeatures') ? searchParams.get('esFeatures').split(',') : [];
        const tpConfig = searchParams.get('tpConfig') || tp_configs[0].id;

        return { esVersion, esFeatureType, esFeatures, tpConfig };
    };

    // Initialize state from URL parameters
    const { esVersion: initialEsVersion, esFeatureType: initialEsFeatureType, esFeatures: initialEsFeatures, tpConfig: initialTpConfig } = parseUrlParams();

    // es options
    const [esOptionFeatureType, setEsOptionFeatureType] = useState(initialEsFeatureType);
    const [esOptionFeatures, setEsOptionFeatures] = useState(initialEsFeatures);
    const [esOptionConfig, setEsOptionConfig] = useState(initialTpConfig);
    const [esOptionVersion, setEsOptionVersion] = useState(initialEsVersion);
    const [esOptionPrefilled, setEsOptionPrefilled] = useState(false);

    // server options
    const [es_option_reg, setEs_option_reg] = useState(true);
    const [es_option_sub, setEs_option_sub] = useState(true);

    const computeEsConfig = (esOptionFeatureType, esOptionConfig, esOptionFeatures, esOptionVersion, esOptionPrefilled) => {
        const esConfig: any = {
            config_id: esOptionConfig,
            response_type: 'code',
            override_default_response_type: true,
            extras: {
                sessionInfoVersion: '3',
                version: esOptionVersion,
                featureType: esOptionFeatureType,
                features: esOptionFeatures ? esOptionFeatures.map((feature) => { return { name: feature } }) : null,
            }
        }
        if (esOptionFeatureType === '') {
            delete esConfig.extras.featureType;
        }
        if (esOptionPrefilled) {
            esConfig.setup = es_prefilled_setup;
        }
        return esConfig;
    }

    const [esConfig, setEsConfig] = useState(JSON.stringify(computeEsConfig(esOptionFeatureType, esOptionConfig, esOptionFeatures, esOptionVersion, esOptionPrefilled), null, 2));
    const [bannerInfo, setBannerInfo] = useState("");
    const [lastEventData, setLastEventData] = useState(null);

    const handleBannerInfoChange = useCallback((info: string) => {
        setBannerInfo(info);
    }, []);

    const handleLastEventDataChange = useCallback((data: any) => {
        setLastEventData(data);
    }, []);

    const handleSaveToken = useCallback((code: string, session_info: SessionInfo) => {
        setBannerInfo('Setting up WABA...');
        const { waba_id, business_id, phone_number_id, page_ids, catalog_ids, dataset_ids, instagram_account_ids } = session_info.data;
        feGraphApiPostWrapper('/api/token', {
            code, app_id,
            waba_id,
            waba_ids: waba_id ? [waba_id] : [],
            business_id,
            phone_number_id,
            page_ids: page_ids || [],
            ad_account_ids: [],
            dataset_ids: dataset_ids || [],
            catalog_ids: catalog_ids || [],
            instagram_account_ids: instagram_account_ids || [],
            es_option_reg, es_option_sub, user_id
        })
            .then(d => {
                const resp_msg = formatErrors(d);
                setBannerInfo("WABA Setup Finished\n" + resp_msg + '\n');
            });
    }, [app_id, es_option_reg, es_option_sub, user_id]);

    const handleClickFbl4b = useCallback(() => {
        fetch('/api/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id,
                action: 'launch_fbl4b'
            }),
        });
    }, [user_id]);

    // ES Options Setters
    const setEsOptionFeatureTypeSetter = (esOptionFeatureType) => {
        if (esOptionFeatureType === 'only_waba_sharing') setEs_option_reg(false);
        setEsOptionFeatureType(esOptionFeatureType);
        updateUrlParams({ esFeatureType: esOptionFeatureType });
        setEsConfig(JSON.stringify(computeEsConfig(esOptionFeatureType, esOptionConfig, esOptionFeatures, esOptionVersion, esOptionPrefilled), null, 2));
    }

    const setEsOptionConfigSetter = (esOptionConfig) => {
        setEsOptionConfig(esOptionConfig);
        updateUrlParams({ tpConfig: esOptionConfig });
        setEsConfig(JSON.stringify(computeEsConfig(esOptionFeatureType, esOptionConfig, esOptionFeatures, esOptionVersion, esOptionPrefilled), null, 2));
    }

    const setEs_option_regSetter = (es_option_regInner) => {
        if (es_option_regInner && esOptionFeatureType === 'only_waba_sharing') setEsOptionFeatureTypeSetter("");
        setEs_option_reg(es_option_regInner);
    }

    const setEsOptionVersionSetter = (esOptionVersion) => {
        setEsOptionVersion(esOptionVersion);
        updateUrlParams({ esVersion: esOptionVersion });
        setEsConfig(JSON.stringify(computeEsConfig(esOptionFeatureType, esOptionConfig, esOptionFeatures, esOptionVersion, esOptionPrefilled), null, 2));
    }

    const setEsOptionPrefilledSetter = (esOptionPrefilled) => {
        setEsOptionPrefilled(esOptionPrefilled);
        setEsConfig(JSON.stringify(computeEsConfig(esOptionFeatureType, esOptionConfig, esOptionFeatures, esOptionVersion, esOptionPrefilled), null, 2));
    }

    const bannerChild = (lastEventData) ? (<pre className="text-xs whitespace-pre-wrap">{bannerInfo + '\n' + '\n' + JSON.stringify(lastEventData, null, 2)}</pre>) : null;

    const handleFeaturesChange = (e) => {
        const newFeatures = e.target.value.split(',').map(f => f.trim()).filter(f => f);
        setEsOptionFeatures(newFeatures);
        updateUrlParams({ esFeatures: newFeatures });
        setEsConfig(JSON.stringify(computeEsConfig(esOptionFeatureType, esOptionConfig, newFeatures, esOptionVersion, esOptionPrefilled), null, 2));
    };

    return (
        <div className="flex gap-8 p-6">
            {/* Main Configuration Panel */}
            <div className="flex-1 min-w-0">
                {/* App Information Section */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">App information</h2>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                            <span className="text-sm text-gray-600">App ID:</span>
                            <a
                                target="_blank"
                                href={`https://developers.facebook.com/apps/${app_id}`}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                {app_id}
                            </a>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                            <span className="text-sm text-gray-600">BM ID:</span>
                            <a
                                target="_blank"
                                href={`https://business.facebook.com/latest/settings/whatsapp_account?business_id=${bm_id}`}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                {bm_id}
                            </a>
                        </div>
                    </div>
                </div>

                {/* Server Options Section */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Server options</h2>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                            <span className="text-sm text-gray-700">Register number</span>
                            <input
                                type="checkbox"
                                checked={es_option_reg}
                                onChange={(e) => setEs_option_regSetter(e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                            <span className="text-sm text-gray-700">Subscribe webhooks</span>
                            <input
                                type="checkbox"
                                checked={es_option_sub}
                                onChange={(e) => setEs_option_sub(e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                        </div>
                    </div>
                </div>

                {/* Embedded Signup Specific Options Section */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Embedded Signup specific options</h2>
                    <div className="space-y-4">
                        {/* ES Version */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ES version <InfoIcon />
                            </label>
                            <select
                                value={esOptionVersion}
                                onChange={(e) => setEsOptionVersionSetter(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {public_es_versions.map((version) => (
                                    <option key={version} value={version}>{version}</option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-500">
                                Use v2 for production, v3 for new integrations without legacy forks, or preview versions for testing.
                            </p>
                        </div>

                        {/* ES Feature Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ES feature type <InfoIcon />
                            </label>
                            <select
                                value={esOptionFeatureType}
                                onChange={(e) => setEsOptionFeatureTypeSetter(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">none</option>
                                {public_es_feature_types[esOptionVersion].map((featureType) => (
                                    <option key={featureType} value={featureType}>{featureType}</option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-500">
                                Choose whatsapp_business_app_onboarding for full WhatsApp onboarding or only_waba_sharing to restrict to WABA sharing only.
                            </p>
                        </div>

                        {/* ES Features */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ES features <InfoIcon />
                            </label>
                            <input
                                type="text"
                                value={esOptionFeatures.join(', ')}
                                onChange={handleFeaturesChange}
                                placeholder="marketing_messages_lite"
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Enter feature flags to enable specific onboarding capabilities. Leave empty for default.
                            </p>
                        </div>

                        {/* ES Pre-filled */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <span className="text-sm text-gray-700">
                                ES pre-filled <InfoIcon />
                            </span>
                            <input
                                type="checkbox"
                                checked={esOptionPrefilled}
                                onChange={(e) => setEsOptionPrefilledSetter(e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                        </div>
                    </div>
                </div>

                {/* Configuration Options Section */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration options</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TP config</label>
                        <select
                            value={esOptionConfig}
                            onChange={(e) => setEsOptionConfigSetter(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {tp_configs.map((config) => (
                                <option key={config.id} value={config.id}>{config.name} ({config.id})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Resulting JSON Section */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Resulting JSON</h2>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap overflow-auto">
                            {esConfig}
                        </pre>
                    </div>
                </div>
            </div>

            {/* Right Panel - Test Integration */}
            <div className="w-80">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Integration</h3>
                    <p className="text-sm text-gray-600 mb-4">Share your Meta assets with {app_name}</p>
                    <FBL4BLauncher
                        app_id={app_id}
                        app_name={app_name}
                        esConfig={esConfig}
                        onClickFbl4b={handleClickFbl4b}
                        onBannerInfoChange={handleBannerInfoChange}
                        onLastEventDataChange={handleLastEventDataChange}
                        onSaveToken={handleSaveToken}
                    />
                    <BspBanner>
                        {bannerChild}
                    </BspBanner>
                </div>
            </div>
        </div>
    );
}
