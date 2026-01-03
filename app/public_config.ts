// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

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
    "business_id": process.env.FB_BUSINESS_ID,
    "graph_api_version": process.env.FB_GRAPH_API_VERSION,
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
            "app_only_install",
        ],
        "v3": [
            "marketing_messages_lite",
            "app_only_install",
        ],
        "v3-public-preview": [
            "marketing_messages_lite",
            "app_only_install",
        ],
        "v4": [
            "app_only_install"
        ],
    },
    "public_es_versions": [
        "v2",
        "v2-public-preview",
        "v3-alpha-1",
        "v3",
        "v3-public-preview",
        "v4",
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
        ],
        "v3-public-preview": [
            "whatsapp_business_app_onboarding",
        ],
        "v4": [
            "whatsapp_business_app_onboarding",
        ],
    },
    es_prefilled_setup
};

export default publicConfig;
