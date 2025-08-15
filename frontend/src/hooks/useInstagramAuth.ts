import { useState, useEffect, useCallback } from 'react';

export const useInstagramAuth = () => {
  const [authState, setAuthState] = useState<'checking' | 'unauthenticated' | 'authenticated'>('checking');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  const checkInstagramAuth = useCallback(async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/auth/instagram/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        const authenticatedBusiness = data.businesses?.find((b: any) => b.isAuthenticated);

        if (authenticatedBusiness) {
          setSelectedBusinessId(authenticatedBusiness.businessId);
          setAuthState('authenticated');
        } else {
          setSelectedBusinessId(null);
          setAuthState('unauthenticated');
        }
      } else {
        setSelectedBusinessId(null);
        setAuthState('unauthenticated');
      }
    } catch (error) {
      console.error('Failed to check Instagram auth:', error);
      setSelectedBusinessId(null);
      setAuthState('unauthenticated');
    }
  }, []);

  const handleAuthSuccess = useCallback((businessId: string) => {
    setSelectedBusinessId(businessId);
    setAuthState('authenticated');
  }, []);

  useEffect(() => {
    checkInstagramAuth();
  }, [checkInstagramAuth]);

  return {
    authState,
    selectedBusinessId,
    checkInstagramAuth,
    handleAuthSuccess
  };
};
