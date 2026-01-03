// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


// Define the type for required environment variables
export type RequiredEnvVars = {
    [key: string]: string | undefined;
};

export type MissingEnvVarInfo = {
    name: string;
    description: string;
};

export const ENV_VAR_DESCRIPTIONS: { [key: string]: string } = {
    // Facebook/Meta Configuration
    'FB_APP_ID': 'Facebook App ID for the application',
    'FB_APP_SECRET': 'Facebook App Secret (private)',
    'FB_BUSINESS_ID': 'Facebook Business Manager ID',
    'FB_GRAPH_API_VERSION': 'Facebook Graph API version to use',
    'FB_REG_PIN': 'Facebook Registration PIN (private)',
    'FB_VERIFY_TOKEN': 'Facebook Webhook Verify Token (private)',

    // Auth0 Configuration
    'APP_BASE_URL': 'Base URL of the application (e.g., http://localhost:3000)',
    'AUTH0_DOMAIN': 'Auth0 domain (e.g., your-tenant.auth0.com)',
    'AUTH0_SECRET': 'Auth0 secret for session encryption',
    'AUTH0_CLIENT_ID': 'Auth0 client ID',
    'AUTH0_CLIENT_SECRET': 'Auth0 client secret',

    // Database Configuration
    // Auto configured if you use Vercel to connect your DB
    'POSTGRES_URL': 'PostgreSQL connection URL',

    // Ably Configuration
    'ABLY_KEY': 'Ably API key for real-time messaging',

    // Contact Information
    'TP_CONTACT_EMAIL': 'Contact email for the application'
};

export function getMissingEnvVars(): MissingEnvVarInfo[] {
    return Object.entries(ENV_VAR_DESCRIPTIONS)
        .filter(([key]) => !(key in process.env))
        .map(([key]) => ({
            name: key,
            description: ENV_VAR_DESCRIPTIONS[key] || 'No description available'
        }));
}
