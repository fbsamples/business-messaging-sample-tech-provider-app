// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


// Environment variable validation and error handling

import checkEnvironmentVariables from "./env_checker";

// Define all required environment variables
const requiredEnvVars = {
    // Facebook Configuration
    FB_APP_ID: process.env.FB_APP_ID,
    FB_TP_CONFIG_IDS: process.env.FB_TP_CONFIG_IDS,
    FB_BUSINESS_ID: process.env.FB_BUSINESS_ID,
    FB_GRAPH_API_VERSION: process.env.FB_GRAPH_API_VERSION,

    // Contact Information
    TP_CONTACT_EMAIL: process.env.TP_CONTACT_EMAIL,

    // Auth0 Configuration (required for authentication)
    AUTH0_BASE_URL: process.env.AUTH0_BASE_URL,
    AUTH0_ISSUER_BASE_URL: process.env.AUTH0_ISSUER_BASE_URL,
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,

    // Database Configuration
    POSTGRES_URL: process.env.POSTGRES_URL,

    // Ably Configuration (for real-time messaging)
    ABLY_KEY: process.env.ABLY_KEY
};

checkEnvironmentVariables(requiredEnvVars);

const input = process.env.FB_TP_CONFIG_IDS;
const output = input.split(',').map(item => {

    const [name, tpconfigid] = item.split('|');
    return {
        name,
        tpconfigid
    };
});

const es_prefilled_setup = {
    "business": {
        "id": null,
        "name": "Prefilled Business Name",
        "email": "prefilled_email@gmail.com",
        "phone": {
            "code": 1,
            "number": "1235554678"
        },
        "website": "https://prefilled_website.com/",
        "address": {
            "streetAddress1": "Prefilled St",
            "city": "Prefilled City",
            "state": "CA",
            "zipPostal": "94025",
            "country": "US"
        },
        "timezone": "UTC-07:00"
    },
    "phone": {
        "displayName": "Prefilled Display Name",
        "category": "OTHER",
        "description": ""
    },
    "preVerifiedPhone": {
        "ids": [
        ]
    },
    "solutionID": null,
    "whatsAppBusinessAccount": {
        "ids": null
    }
};


const publicConfig =
{
    "app_id": process.env.FB_APP_ID,
    "redirect_uri": "",
    "contact_email": process.env.TP_CONTACT_EMAIL,
    "config_id": process.env.FB_TP_CONFIG_ID,
    "business_id": process.env.FB_BUSINESS_ID,
    "graph_api_version": process.env.FB_GRAPH_API_VERSION,
    "tp_configs": output,
    "public_es_feature_options": {
        "v2": [
            "marketing_messages_lite"
        ],
        "v2-public-preview": [
            "marketing_messages_lite",
            "app_only_install"
        ],
        "v3-alpha-1": [
            "marketing_messages_lite",
            "cloud_api",
            "conversions_api",
            "mm_mapi",
            "ctwa",
            "ctm",
            "ctd",
            "api_access_only",
        ],
        "v3": [
            "marketing_messages_lite",
            "api_access_only",
        ],
        "v3-public-preview": [
            "marketing_messages_lite",
            "api_access_only",
        ]
    },
    "public_es_versions": [
        "v2",
        "v2-public-preview",
        "v3-alpha-1",
        "v3",
        "v3-public-preview",
    ],
    "public_es_feature_types": {
        "v2": [
            "whatsapp_business_app_onboarding",
            "only_waba_sharing"
        ],
        "v2-public-preview": [
            "whatsapp_business_app_onboarding",
            "only_waba_sharing",
            "marketing_messages_lite"
        ],
        "v3-alpha-1": [
            "whatsapp_business_app_onboarding",
        ],
        "v3": [
            "whatsapp_business_app_onboarding",
            "api_access_only"
        ],
        "v3-public-preview": [
            "whatsapp_business_app_onboarding"
        ],
    },
    es_prefilled_setup
};

export default publicConfig;
