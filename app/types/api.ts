// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

// API Response Types for be_utils.ts

// ============================================================================
// OAuth & Token Management
// ============================================================================

export type FacebookError = {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
};

// ============================================================================
// Webhook Management
// ============================================================================

export type SubscribeWebhookResponse = {
    success: boolean;
    error?: FacebookError;
};

// ============================================================================
// Database Operations (SQL Results)
// ============================================================================

export type SqlResult = {
    command: string;
    rowCount: number;
    oid: number;
    rows: any[];
};

// ============================================================================
// WABA (WhatsApp Business Account) Types
// ============================================================================

export type WabaDetails = {
    id: string;
    account_review_status: string;
    purchase_order_number?: string;
    audiences?: any[];
    name: string;
    ownership_type: string;
    subscribed_apps: {
        data: Array<{
            id: string;
            name: string;
        }>;
    };
    business_verification_status: string;
    country: string;
    currency: string;
    timezone_id: string;
    on_behalf_of_business_info?: any;
    schedules?: any[];
    is_enabled_for_insights: boolean;
    message_templates?: any;
    phone_numbers: {
        data: PhoneNumber[];
    };
    business_id?: string;
    access_token?: string;
};

export type WabaRow = {
    waba_id: string;
    access_token: string;
    business_id: string;
};

export type WabaWithDetails = WabaDetails & {
    business_id: string;
    access_token: string;
};

// ============================================================================
// Phone Number Types
// ============================================================================

export type PhoneNumber = {
    id: string;
    display_phone_number: string;
    verified_name: string;
    quality_rating: string;
    platform_type: string;
    throughput: {
        level: string;
    };
    last_onboarded_time: string;
    wabaId?: string;
    isAckBotEnabled?: boolean;
};

export type PhoneDetails = {
    id: string;
    status: string;
    account_mode: string;
    certificate: string;
    is_on_biz_app: boolean;
    display_phone_number: string;
    code_verification_status: string;
    wabaId: string;
    isAckBotEnabled: boolean;
};

export type ClientPhone = PhoneDetails & {
    wabaId: string;
    isAckBotEnabled: boolean;
};

// ============================================================================
// Registration & Verification
// ============================================================================

export type RegisterNumberResponse = {
    success: boolean;
    error?: FacebookError;
};

export type DeregisterNumberResponse = {
    success: boolean;
    error?: FacebookError;
};

export type RequestCodeResponse = {
    success: boolean;
    error?: FacebookError;
};

export type VerifyCodeResponse = {
    success: boolean;
    error?: FacebookError;
};

// ============================================================================
// Messaging
// ============================================================================

export type SendMessageResponse = {
    messaging_product: string;
    contacts: Array<{
        input: string;
        wa_id: string;
    }>;
    messages: Array<{
        id: string;
        message_status: string;
    }>;
    error?: FacebookError;
};

// ============================================================================
// Pages
// ============================================================================

export type PageRow = {
    page_id: string;
    access_token: string;
    business_id: string;
};

export type PageWithDetails = {
    page_id: string;
    name: string;
    access_token: string;
    business_id: string;
    ad_campaign: string;
};

// ============================================================================
// Ad Accounts
// ============================================================================

export type AdAccountRow = {
    ad_account_id: string;
    access_token: string;
    business_id: string;
};

export type AdAccountWithDetails = {
    ad_account_id: string;
    name: string;
    access_token: string;
    business_id: string;
};

// ============================================================================
// Datasets
// ============================================================================

export type DatasetRow = {
    dataset_id: string;
    access_token: string;
    business_id: string;
};

export type DatasetWithDetails = {
    id: string;
    name: string;
    code: string;
    status: string;
    last_fired_time: string | null;
    access_token: string;
    business_id: string;
};

// ============================================================================
// Catalogs
// ============================================================================

export type CatalogRow = {
    catalog_id: string;
    access_token: string;
    business_id: string;
};

export type CatalogWithDetails = {
    id: string;
    name: string;
    access_token: string;
    business_id: string;
};

// ============================================================================
// Instagram Accounts
// ============================================================================

export type InstagramAccountRow = {
    instagram_account_id: string;
    access_token: string;
    business_id: string;
};

export type InstagramAccountWithDetails = {
    id: string;
    username: string;
    access_token: string;
    business_id: string;
};

// ============================================================================
// App Details
// ============================================================================

export type AppDetails = {
    id: string;
    client_config: {
        package_name?: string;
        ios_bundle_id?: string;
    };
    name: string;
    logo_url?: string;
    app_domains: string[];
    app_type: string;
    company?: string;
    link?: string;
    error?: FacebookError;
    config_ids: [{
        name: string;
        tpconfigid: string;
    }];
};

// ============================================================================
// Subscribed Apps
// ============================================================================

export type SubscribedApp = {
    id: string;
    name: string;
};

export type SubscribedAppsResponse = {
    data: SubscribedApp[];
    error?: FacebookError;
};

// ============================================================================
// Assigned Users
// ============================================================================

export type AssignedUser = {
    id: string;
    name: string;
    email?: string;
};

export type AssignedUsersResponse = {
    data: AssignedUser[];
    error?: FacebookError;
};

// ============================================================================
// AckBot Status
// ============================================================================

export type AckBotStatusResponse = {
    is_ack_bot_enabled: boolean;
};

// ============================================================================
// Generic API Response
// ============================================================================

export type ApiResponse<T = any> = {
    data?: T;
    error?: FacebookError;
    success?: boolean;
};

// ============================================================================
// Function Parameter Types
// ============================================================================


// ============================================================================
// Database Table Types
// ============================================================================

export type WabaTableRow = {
    user_id: string;
    app_id: string;
    waba_id: string;
    access_token: string;
    business_id: string;
    last_updated: Date;
};

export type PageTableRow = {
    user_id: string;
    app_id: string;
    page_id: string;
    access_token: string;
    business_id: string;
    last_updated: Date;
};

export type AdAccountTableRow = {
    user_id: string;
    app_id: string;
    ad_account_id: string;
    access_token: string;
    business_id: string;
    last_updated: Date;
};

export type DatasetTableRow = {
    user_id: string;
    app_id: string;
    dataset_id: string;
    access_token: string;
    business_id: string;
    last_updated: Date;
};

export type CatalogTableRow = {
    user_id: string;
    app_id: string;
    catalog_id: string;
    access_token: string;
    business_id: string;
    last_updated: Date;
};

export type InstagramAccountTableRow = {
    user_id: string;
    app_id: string;
    instagram_account_id: string;
    access_token: string;
    business_id: string;
    last_updated: Date;
};

export type BusinessTableRow = {
    user_id: string;
    app_id: string;
    business_id: string;
    access_token: string;
    last_updated: Date;
};

export type PhoneTableRow = {
    phone_id: string;
    is_ack_bot_enabled: boolean;
};
