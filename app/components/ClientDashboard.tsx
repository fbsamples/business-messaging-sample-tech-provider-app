// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use client';

import { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { formatErrors } from '@/app/errorformat';
import TpButton from '@/app/components/Button';
import BspBanner from '@/app/components/BspBanner';
import { feGraphApiPostWrapper } from '@/app/fe_utils';
import FBL4BLauncher from '@/app/components/Fbl4bLauncher';
import { SessionInfo } from '@/app/types/api';

export default function ClientDashboard({ app_id, app_name, bm_id, user_id, tp_configs, public_es_feature_options, public_es_versions, public_es_feature_types, es_prefilled_setup }) {
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
            config_id: esOptionConfig, // configuration ID goes here
            // auth_type: 'reauthenticate',
            response_type: 'code', // must be set to 'code' for System User access token
            override_default_response_type: true, // when true, any response types passed in the "response_type" will take precedence over the default types
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

    const [esConfig, setEsConfig] = useState(JSON.stringify(computeEsConfig(esOptionFeatureType, esOptionConfig, esOptionFeatures, esOptionVersion, esOptionPrefilled), null, 4));
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
        const { waba_id, business_id, phone_number_id } = session_info.data;
        feGraphApiPostWrapper('/api/token', { code, app_id, waba_id, business_id, phone_number_id, es_option_reg, es_option_sub, user_id })
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
        setEsConfig(JSON.stringify(computeEsConfig(esOptionFeatureType, esOptionConfig, esOptionFeatures, esOptionVersion, esOptionPrefilled), null, 4));
    }

    const setEsOptionConfigSetter = (esOptionConfig) => {
        setEsOptionConfig(esOptionConfig);
        updateUrlParams({ tpConfig: esOptionConfig });
        setEsConfig(JSON.stringify(computeEsConfig(esOptionFeatureType, esOptionConfig, esOptionFeatures, esOptionVersion, esOptionPrefilled), null, 4));
    }

    const setEs_option_regSetter = (es_option_regInner) => {
        if (es_option_regInner && esOptionFeatureType === 'only_waba_sharing') setEsOptionFeatureTypeSetter("");
        setEs_option_reg(es_option_regInner);
    }

    const setEsOptionVersionSetter = (esOptionVersion) => {
        setEsOptionVersion(esOptionVersion);
        updateUrlParams({ esVersion: esOptionVersion });
        setEsConfig(JSON.stringify(computeEsConfig(esOptionFeatureType, esOptionConfig, esOptionFeatures, esOptionVersion, esOptionPrefilled), null, 4));
    }

    const setEsOptionPrefilledSetter = (esOptionPrefilled) => {
        setEsOptionPrefilled(esOptionPrefilled);
        setEsConfig(JSON.stringify(computeEsConfig(esOptionFeatureType, esOptionConfig, esOptionFeatures, esOptionVersion, esOptionPrefilled), null, 4));
    }

    const bannerChild = (lastEventData) ? (<pre>{bannerInfo + '\n' + '\n' + JSON.stringify(lastEventData, null, 2)}</pre>) : null;

    const handleOptionChange = (event) => {
        const optionValue = [...event.target.selectedOptions];
        const newESOptionFeatures = optionValue.map((value) => value.value);
        setEsOptionFeatures(newESOptionFeatures);
        updateUrlParams({ esFeatures: newESOptionFeatures });
        setEsConfig(JSON.stringify(computeEsConfig(esOptionFeatureType, esOptionConfig, newESOptionFeatures, esOptionVersion, esOptionPrefilled), null, 4));
    };

    const loggedInSection = (

        <>
            <div className="flex flex-row grow rounded-lg m-2 px-5 py-4 border-gray-300">

                <div className="mr-5 mb-0 rounded-lg border border-transparent px-5 py-4 border-gray-300 bg-gray-100 text-xs">
                    {/* My Assets Section */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">My Assets</h3>
                        <div className="space-y-2">
                            <TpButton href={`/my_wabas`} title="My WABAs" subtitle={"View all your WABAs"} />
                            <TpButton href={`/my_pages`} title="My Pages" subtitle={"View all your Facebook Pages"} />
                            <TpButton href={`/my_ad_accounts`} title="My Ad Accounts" subtitle={"View all your Facebook Ad Accounts"} />
                            <TpButton href={`/my_datasets`} title="My Datasets" subtitle={"View all your Facebook Datasets"} />
                            <TpButton href={`/my_catalogs`} title="My Catalogs" subtitle={"View all your Facebook Catalogs"} />
                        </div>
                    </div>

                    {/* Developer Tools Section */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">Developer Tools</h3>
                        <div className="space-y-2">
                            <TpButton href={`/my_webhooks`} title="My Webhooks" subtitle={"Debug tool showing all your incoming webhooks"} />
                        </div>
                    </div>

                    {/* Sample Products Section */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">Sample Products</h3>
                        <div className="space-y-2">
                            <TpButton href={`/my_inbox`} title="My Inbox" subtitle={"Send and receive messages across all your phone numbers"} />
                        </div>
                    </div>
                </div>

                <div className="mr-5 mb-0 rounded-lg border border-gray-200 px-6 py-6 bg-white shadow-xs text-sm min-w-[400px]">
                    {/* App Information Section */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">App Information</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium text-gray-700">App ID:</span>
                                <a
                                    target="_blank"
                                    href={`https://developers.facebook.com/apps/${app_id}`}
                                    className="text-blue-600 hover:text-blue-800 font-mono text-sm"
                                >
                                    {app_id}
                                </a>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium text-gray-700">BM ID:</span>
                                <a
                                    target="_blank"
                                    href={`https://business.facebook.com/latest/settings/whatsapp_account?business_id=${bm_id}`}
                                    className="text-blue-600 hover:text-blue-800 font-mono text-sm"
                                >
                                    {bm_id}
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Server Options Section */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Server Options</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <label className="font-medium text-gray-700">Register Number</label>
                                <input
                                    type="checkbox"
                                    checked={es_option_reg}
                                    onChange={(e) => setEs_option_regSetter(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 focus:ring-2"
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <label className="font-medium text-gray-700">Subscribe Webhooks</label>
                                <input
                                    type="checkbox"
                                    checked={es_option_sub}
                                    onChange={(e) => setEs_option_sub(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 focus:ring-2"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ES Specific Options Section */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">ES Specific Options</h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">ES Version</label>
                                <select
                                    value={esOptionVersion}
                                    onChange={(e) => { console.log(e.target.value); setEsOptionVersionSetter(e.target.value) }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                >
                                    {public_es_versions.map((version) => (
                                        <option key={version} value={version}>{version}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">ES Feature Type</label>
                                <select
                                    value={esOptionFeatureType}
                                    onChange={(e) => { console.log(e.target.value); setEsOptionFeatureTypeSetter(e.target.value) }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                >
                                    {
                                        public_es_feature_types[esOptionVersion].map((featureType) => (
                                            <option key={featureType} value={featureType}>{featureType}</option>
                                        ))
                                    }
                                    <option value="">none</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">ES Features</label>
                                <select
                                    multiple={true}
                                    value={esOptionFeatures}
                                    onChange={handleOptionChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-h-[80px]"
                                >
                                    {
                                        public_es_feature_options[esOptionVersion].map((feature) => (
                                            <option key={feature} value={feature}>{feature}</option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <label className="font-medium text-gray-700">ES Pre-filled</label>
                                <input
                                    type="checkbox"
                                    checked={esOptionPrefilled}
                                    onChange={(e) => setEsOptionPrefilledSetter(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 focus:ring-2"
                                />
                            </div>

                        </div>
                    </div>

                    {/* FBL4B Options Section */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">FBL4B Options</h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">TP Config</label>
                                <select
                                    value={esOptionConfig}
                                    onChange={(e) => { console.log(e.target.value); setEsOptionConfigSetter(e.target.value) }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                >
                                    {
                                        tp_configs.map((config) => (
                                            <option key={config.id} value={config.id}>{config.name} ({config.id})</option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>
                    </div>


                    {/* Resulting JSON Section */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resulting JSON</h2>
                        <textarea
                            value={esConfig}
                            onChange={(e) => { setEsConfig(e.target.value) }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono text-xs resize-none"
                            rows={12}
                            placeholder="ES configuration will appear here..."
                        />
                    </div>
                </div>
                <div className="mr-5 mb-0 rounded-lg border border-transparent px-5 py-4 border-gray-300 bg-gray-100 text-xs">

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
        </>
    );
    return loggedInSection;
}
