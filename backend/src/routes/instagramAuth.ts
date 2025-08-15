import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Instagram OAuth configuration
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID || '';
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET || '';
const REDIRECT_URI = `https://localhost:${process.env.PORT || 3001}/auth/instagram/callback`;

console.log('🔗 Using redirect URI:', REDIRECT_URI);
const SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_messages',
  'instagram_business_manage_comments',
  'instagram_business_content_publish',
  'instagram_business_manage_insights'
].join(',');

// In-memory storage for access tokens (in prod, use a database)
interface BusinessAuth {
  businessId: string;
  accessToken: string;
  longLivedToken?: string;
  expiresAt?: Date;
  userId: string;
  permissions: string[];
  createdAt: Date;
}

const businessTokens = new Map<string, BusinessAuth>();
// Serve the OAuth callback page and handle token exchange
router.get('/callback', async (req, res) => {
  const { code, error, error_reason, error_description } = req.query;

  let authResult = null;
  let authError = null;

  // Instagram API token exchange
  if (code && !error) {
    try {
      console.log('🔄 Exchanging Instagram OAuth code for access token...');
      console.log('📋 Request details:', {
        client_id: INSTAGRAM_APP_ID,
        redirect_uri: REDIRECT_URI,
        code: code,
        grant_type: 'authorization_code'
      });

      // Step 1: Exchange code for short-lived access token
      const params = new URLSearchParams();
      params.append('client_id', INSTAGRAM_APP_ID);
      params.append('client_secret', INSTAGRAM_APP_SECRET);
      params.append('grant_type', 'authorization_code');
      params.append('redirect_uri', REDIRECT_URI);
      params.append('code', code as string);


      const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        body: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`HTTP ${tokenResponse.status}: ${errorText}`);
      }

      const tokenData = await tokenResponse.json() as any;

      console.log('✅ Short-lived token received:', tokenData);

      const { access_token: shortLivedToken, user_id: userId } = tokenData;

      // Step 2: Exchange short-lived token for long-lived token
      console.log('🔄 Exchanging for long-lived token...');

      const longLivedUrl = new URL('https://graph.instagram.com/access_token');
      longLivedUrl.searchParams.append('grant_type', 'ig_exchange_token');
      longLivedUrl.searchParams.append('client_secret', INSTAGRAM_APP_SECRET);
      longLivedUrl.searchParams.append('access_token', shortLivedToken);

      const longLivedResponse = await fetch(longLivedUrl.toString());

      if (!longLivedResponse.ok) {
        const errorText = await longLivedResponse.text();
        throw new Error(`HTTP ${longLivedResponse.status}: ${errorText}`);
      }

      const longLivedData = await longLivedResponse.json() as any;

      console.log('✅ Long-lived token received:', longLivedData);

      const { access_token: longLivedToken, expires_in } = longLivedData;

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

      // Store the business authentication
      const businessId = `business_${userId}_${Date.now()}`;
      const businessAuth: BusinessAuth = {
        businessId,
        accessToken: longLivedToken,
        longLivedToken,
        expiresAt,
        userId,
        permissions: SCOPES.split(','),
        createdAt: new Date()
      };

      businessTokens.set(businessId, businessAuth);

      console.log('✅ Business authentication stored:', businessId);

      authResult = {
        success: true,
        businessId,
        accessToken: longLivedToken,
        expiresAt: expiresAt.toISOString(),
        userId,
        permissions: businessAuth.permissions
      };

    } catch (err) {
      console.error('❌ Instagram OAuth callback error:', err);

      if (err instanceof Error) {
        authError = err.message || 'Failed to exchange code for token';
      } else {
        authError = 'Failed to complete Instagram authentication';
      }
    }
  } else if (error) {
    authError = error_description || error_reason || error;
  } else {
    authError = 'No authorization code received';
  }

  // temporary page after user authenticates successfully!
  const callbackHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Instagram Authentication</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
        }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .instagram-icon {
            width: 48px;
            height: 48px;
            background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="instagram-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.40s-.644-1.44-1.439-1.40z"/>
            </svg>
        </div>
        ${authResult ? `
        <h2 class="success">Authentication Successful!</h2>
        <div class="success">
            <strong>Success!</strong> Your Instagram account has been connected.
            <br><br>
            <small>This window will close automatically...</small>
        </div>
        ` : `
        <h2 class="error">Authentication Failed</h2>
        <div class="error">
            <strong>Error:</strong> ${authError}
            <br><br>
            <small>This window will close automatically...</small>
        </div>
        `}
    </div>

    <script>
        // Send result to parent window
        if (window.opener) {
            // Send to all possible frontend origins
            const frontendOrigins = [
                'http://localhost:3000',
                'https://localhost:3000',
                window.location.protocol + '//' + window.location.hostname + ':3000'
            ];

            const messageData = ${authResult ? `{
                type: 'INSTAGRAM_AUTH_SUCCESS',
                businessId: '${authResult.businessId}',
                userId: '${authResult.userId}',
                accessToken: '${authResult.accessToken}',
                expiresAt: '${authResult.expiresAt}'
            }` : `{
                type: 'INSTAGRAM_AUTH_ERROR',
                error: '${authError || 'Unknown error'}'
            }`};

            // Try sending to each possible origin
            frontendOrigins.forEach(origin => {
                try {
                    window.opener.postMessage(messageData, origin);
                } catch (e) {
                    console.log('Could not send message to origin:', origin, e);
                }
            });

            // Also try sending with '*' as fallback (less secure but works)
            try {
                window.opener.postMessage(messageData, '*');
            } catch (e) {
                console.log('Could not send message with wildcard origin:', e);
            }
        }
        // Close window after delay
        setTimeout(function() {
            window.close();
        }, ${authResult ? '2000' : '3000'});
    </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(callbackHtml);
});

// Get Instagram OAuth URL
router.get('/oauth-url', (_, res) => {
  try {
    const state = Math.random().toString(36).substring(2, 15); // Generate random state for CSRF protection

    console.log('🔗 OAuth URL generation details:');
    console.log('  - Client ID:', INSTAGRAM_APP_ID);
    console.log('  - Redirect URI:', REDIRECT_URI);
    console.log('  - Encoded Redirect URI:', encodeURIComponent(REDIRECT_URI));
    console.log('  - Scopes:', SCOPES);

    const oauthUrl = `https://www.instagram.com/oauth/authorize?` +
      `client_id=${INSTAGRAM_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(SCOPES)}&` +
      `state=${state}&` +
      `force_reauth=true`;

    console.log('🌐 Generated OAuth URL:', oauthUrl);

    res.json({
      success: true,
      oauthUrl,
      state,
      redirectUri: REDIRECT_URI
    });
  } catch (error) {
    console.error('Error generating OAuth URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate OAuth URL'
    });
  }
});

// Get current business authentication status
router.get('/status/:businessId?', (req, res) => {
  try {
    const { businessId } = req.params;

    if (businessId) {
      // Get specific business auth
      const auth = businessTokens.get(businessId);
      if (!auth) {
        return res.status(404).json({
          success: false,
          error: 'Business authentication not found'
        });
      }

      // Check if token is expired
      const isExpired = auth.expiresAt && auth.expiresAt < new Date();

      res.json({
        success: true,
        businessId: auth.businessId,
        userId: auth.userId,
        isAuthenticated: !isExpired,
        expiresAt: auth.expiresAt?.toISOString(),
        permissions: auth.permissions,
        createdAt: auth.createdAt.toISOString()
      });
    } else {
      // Get all business auths
      const auths = Array.from(businessTokens.values()).map(auth => ({
        businessId: auth.businessId,
        userId: auth.userId,
        isAuthenticated: !auth.expiresAt || auth.expiresAt > new Date(),
        expiresAt: auth.expiresAt?.toISOString(),
        permissions: auth.permissions,
        createdAt: auth.createdAt.toISOString()
      }));

      res.json({
        success: true,
        businesses: auths
      });
    }
  } catch (error) {
    console.error('Error getting auth status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get authentication status'
    });
  }
});

// Get access token for a business (for internal use by other services)
router.get('/token/:businessId', (req, res) => {
  try {
    const { businessId } = req.params;
    const auth = businessTokens.get(businessId);

    if (!auth) {
      return res.status(404).json({
        success: false,
        error: 'Business authentication not found'
      });
    }

    // Check if token is expired
    const isExpired = auth.expiresAt && auth.expiresAt < new Date();
    if (isExpired) {
      return res.status(401).json({
        success: false,
        error: 'Access token has expired'
      });
    }

    res.json({
      success: true,
      accessToken: auth.accessToken,
      expiresAt: auth.expiresAt?.toISOString()
    });
  } catch (error) {
    console.error('Error getting access token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get access token'
    });
  }
});

// Revoke business authentication (not used yet)
router.delete('/revoke/:businessId', (req, res) => {
  try {
    const { businessId } = req.params;
    const deleted = businessTokens.delete(businessId);

    if (deleted) {
      console.log('✅ Business authentication revoked:', businessId);
      res.json({
        success: true,
        message: 'Business authentication revoked successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Business authentication not found'
      });
    }
  } catch (error) {
    console.error('Error revoking auth:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke authentication'
    });
  }
});

// Refresh long-lived token (should be called before expiration)
router.post('/refresh/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const auth = businessTokens.get(businessId);

    if (!auth) {
      return res.status(404).json({
        success: false,
        error: 'Business authentication not found'
      });
    }

    console.log('🔄 Refreshing long-lived token for business:', businessId);

    // Refresh the long-lived token
    const refreshUrl = new URL('https://graph.instagram.com/refresh_access_token');
    refreshUrl.searchParams.append('grant_type', 'ig_refresh_token');
    refreshUrl.searchParams.append('access_token', auth.accessToken);

    const refreshResponse = await fetch(refreshUrl.toString());

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      throw new Error(`HTTP ${refreshResponse.status}: ${errorText}`);
    }

    const refreshData = await refreshResponse.json() as any;
    const { access_token: newToken, expires_in } = refreshData;

    // Update expiration date
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

    // Update stored auth
    auth.accessToken = newToken;
    auth.longLivedToken = newToken;
    auth.expiresAt = expiresAt;

    businessTokens.set(businessId, auth);

    console.log('✅ Token refreshed successfully for business:', businessId);

    res.json({
      success: true,
      accessToken: newToken,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('❌ Token refresh error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to refresh access token'
    });
  }
});

// Export function to get access token for use by other services
export const getBusinessAccessToken = (businessId: string): string | null => {
  const auth = businessTokens.get(businessId);
  if (!auth) return null;

  // Check if token is expired
  const isExpired = auth.expiresAt && auth.expiresAt < new Date();
  if (isExpired) return null;

  return auth.accessToken;
};

// Export function to get all authenticated businesses
export const getAuthenticatedBusinesses = (): BusinessAuth[] => {
  return Array.from(businessTokens.values()).filter(auth =>
    !auth.expiresAt || auth.expiresAt > new Date()
  );
};

export default router;
