// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.


// Define the type for required environment variables
type RequiredEnvVars = {
    [key: string]: string | undefined;
};

function checkEnvironmentVariables(requiredEnvVars: RequiredEnvVars) {
    // Check for missing environment variables
    const missingEnvVars = Object.entries(requiredEnvVars)
        .filter(([_key, value]) => !value)
        .map(([key]) => key);

    if (missingEnvVars.length > 0) {
        const errorMessage = `Missing required environment variables: ${missingEnvVars.join(', ')}. Please check your .env.local file and ensure all required variables are set.`;
        console.error('❌ Environment Configuration Error:', errorMessage);

        // Provide detailed information about missing variables
        console.error('\n📋 Missing Environment Variables:');
        missingEnvVars.forEach(varName => {
            const descriptions: { [key: string]: string } = {
                'ABLY_KEY': 'Ably API key for real-time messaging',
                'APP_BASE_URL': 'Base URL for Auth0 redirects',
                'AUTH0_CLIENT_ID': 'Auth0 client ID',
                'AUTH0_CLIENT_SECRET': 'Auth0 client secret',
                'AUTH0_DOMAIN': 'Auth0 domain',
                'AUTH0_SECRET': 'Auth0 secret for session encryption',
                'FB_APP_ID': 'Facebook App ID for the application',
                'FB_APP_SECRET': 'Facebook App Secret (private)',
                'FB_BUSINESS_ID': 'Facebook Business Manager ID',
                'FB_GRAPH_API_VERSION': 'Facebook Graph API version to use',
                'FB_REG_PIN': 'Facebook Registration PIN (private)',
                'FB_TP_CONFIG_IDS': 'Comma-separated list of TP config IDs in format "name|id,name2|id2"',
                'FB_VERIFY_TOKEN': 'Facebook Webhook Verify Token (private)',
                'POSTGRES_URL': 'PostgreSQL connection URL',
                'TP_CONTACT_EMAIL': 'Contact email for the application'
            };
            console.error(`   ${varName}: ${descriptions[varName] || 'No description available'}`);
        });

        console.error('\n💡 To fix this:');
        console.error('   1. Create a .env.local file in your project root');
        console.error('   2. Add the missing environment variables');
        console.error('   3. Restart your development server');

    } else {
        console.log('✅ All required environment variables are present');
    }
}

export default checkEnvironmentVariables;