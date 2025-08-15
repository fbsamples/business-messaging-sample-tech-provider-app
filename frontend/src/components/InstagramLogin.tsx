import React, { useState, useEffect } from 'react';
import { Instagram, CheckCircle, AlertCircle, RefreshCw, LogOut } from 'lucide-react';

interface BusinessAuth {
  businessId: string;
  userId: string;
  isAuthenticated: boolean;
  expiresAt?: string;
  permissions: string[];
  createdAt: string;
}

interface InstagramLoginProps {
  onAuthSuccess: (businessId: string) => void;
  selectedBusinessId?: string;
  isConnected?: boolean;
}

export const InstagramLogin: React.FC<InstagramLoginProps> = ({
  onAuthSuccess,
  selectedBusinessId,
  isConnected = false
}) => {
  const [businesses, setBusinesses] = useState<BusinessAuth[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authInProgress, setAuthInProgress] = useState(false);

  // Load authenticated businesses on mount
  useEffect(() => {
    loadBusinesses();
  }, []);

  // Set up message listener for OAuth callback
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Accept messages from multiple possible origins
      const allowedOrigins = [
        window.location.origin, // Current frontend origin
        'https://localhost:3001', // HTTPS backend
        'http://localhost:3001',  // HTTP backend fallback
        'https://localhost:3000', // HTTPS frontend
        'http://localhost:3000',  // HTTP frontend
      ];

      // Also accept wildcard messages from the authentication popup
      if (!allowedOrigins.includes(event.origin) && event.origin !== 'null') {
        return;
      }

      if (event.data.type === 'INSTAGRAM_AUTH_SUCCESS') {
        setAuthInProgress(false);
        setError(null);

        if (event.data.businessId) {
          // Call success callback immediately
          onAuthSuccess(event.data.businessId);

          // Load businesses in background after callback
          setTimeout(() => {
            loadBusinesses().catch(err => {
              console.error('Error loading businesses after auth:', err);
            });
          }, 100);
        }
      } else if (event.data.type === 'INSTAGRAM_AUTH_ERROR') {
        console.error('Instagram auth error:', event.data.error);
        setAuthInProgress(false);
        setError(event.data.error || 'Authentication failed');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onAuthSuccess]);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://localhost:3001/api/auth/instagram/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load businesses');
      }

      const data = await response.json();
      if (data.success) {
        setBusinesses(data.businesses || []);
      }
    } catch (err) {
      console.error('Error loading businesses:', err);
      setError('Failed to load authenticated businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setAuthInProgress(true);
      setError(null);

      // Get OAuth URL from backend
      const response = await fetch('https://localhost:3001/api/auth/instagram/oauth-url', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get OAuth URL');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate OAuth URL');
      }

      // Open Instagram OAuth in a popup
      const popup = window.open(
        data.oauthUrl,
        'instagram-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Monitor popup for closure
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setAuthInProgress(false);
        }
      }, 1000);

    } catch (err) {
      console.error('Login error:', err);
      setAuthInProgress(false);
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleRevoke = async (businessId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`https://localhost:3001/api/auth/instagram/revoke/${businessId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to revoke authentication');
      }

      const data = await response.json();
      if (data.success) {
        await loadBusinesses(); // Refresh the list
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to revoke authentication');
      }
    } catch (err) {
      console.error('Revoke error:', err);
      setError(err instanceof Error ? err.message : 'Failed to revoke authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (businessId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`https://localhost:3001/api/auth/instagram/refresh/${businessId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      if (data.success) {
        await loadBusinesses(); // Refresh the list
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to refresh token');
      }
    } catch (err) {
      console.error('Refresh error:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh token');
    } finally {
      setLoading(false);
    }
  };

  const formatExpiryDate = (expiresAt?: string) => {
    if (!expiresAt) return 'Never';
    const date = new Date(expiresAt);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    return `Expires in ${diffDays} days`;
  };

  // If connected and has businesses, show connected state
  if (isConnected && businesses.length > 0) {
    const selectedBusiness = businesses.find(b => b.businessId === selectedBusinessId);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Instagram Connected</h2>
            <p className="text-sm text-gray-500">
              {selectedBusiness ? `Connected as User ID: ${selectedBusiness.userId}` : 'Ready to receive messages'}
            </p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-700">
              <p className="font-medium">Successfully connected!</p>
              <p>Your Instagram business account is now ready to send and receive messages.</p>
            </div>
          </div>
        </div>


        {/* Show connected businesses for management */}
        {businesses.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Manage Connected Accounts</h3>
            <div className="space-y-2">
              {businesses.map((business) => (
                <div
                  key={business.businessId}
                  className={`p-3 border rounded-lg transition-colors ${
                    selectedBusinessId === business.businessId
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {business.isAuthenticated ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          User ID: {business.userId}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatExpiryDate(business.expiresAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleRefresh(business.businessId)}
                        disabled={loading}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        title="Refresh token"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRevoke(business.businessId)}
                        disabled={loading}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Disconnect account"
                      >
                        <LogOut className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
          <Instagram className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Instagram Business Login</h2>
          <p className="text-sm text-gray-500">Connect your Instagram business account to start messaging</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Authenticated Businesses */}
      {businesses.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Connected Accounts</h3>
          <div className="space-y-3">
            {businesses.map((business) => (
              <div
                key={business.businessId}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedBusinessId === business.businessId
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onAuthSuccess(business.businessId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {business.isAuthenticated ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Business Account
                        </div>
                        <div className="text-xs text-gray-500">
                          User ID: {business.userId}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className={`text-xs font-medium ${
                        business.isAuthenticated ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {business.isAuthenticated ? 'Active' : 'Expired'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatExpiryDate(business.expiresAt)}
                      </div>
                    </div>

                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRefresh(business.businessId);
                        }}
                        disabled={loading}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        title="Refresh token"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRevoke(business.businessId);
                        }}
                        disabled={loading}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Disconnect account"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Login Button */}
      <button
        onClick={handleLogin}
        disabled={authInProgress || loading}
        className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
          authInProgress || loading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-pink-500 text-white hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2'
        }`}
      >
        {authInProgress ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Authenticating...</span>
          </>
        ) : (
          <>
            <Instagram className="w-4 h-4" />
            <span>Connect New Instagram Account</span>
          </>
        )}
      </button>

      <div className="mt-4 text-xs text-gray-500">
        <p>By connecting your Instagram account, you agree to allow this application to:</p>
        <ul className="mt-1 ml-4 list-disc space-y-1">
          <li>Access basic account information</li>
          <li>Send and receive messages</li>
          <li>Manage comments on your posts</li>
          <li>Publish content to your account</li>
        </ul>
      </div>
    </div>
  );
};
