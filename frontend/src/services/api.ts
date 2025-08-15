import { Conversation, SendMessageRequest, InboxMessage, InstagramUserProfile } from '../types/message';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:3001';

// Custom fetch wrapper with timeout and error handling
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Helper function to handle fetch response
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: errorText || `HTTP ${response.status}` };
    }
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
  }

  const text = await response.text();
  if (!text) return null;

  try {
    const data = JSON.parse(text);
    return parseDates(data);
  } catch {
    return text;
  }
};

// Helper function to recursively parse date strings
function parseDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Check if string looks like an ISO date
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
      return new Date(obj);
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(parseDates);
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = parseDates(obj[key]);
      }
    }
    return result;
  }

  return obj;
}

export const messageApi = {
  // Get all conversations
  getConversations: async (): Promise<Conversation[]> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/messages/conversations`);
    return await handleResponse(response);
  },

  // Get specific conversation
  getConversation: async (contactId: string): Promise<Conversation> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/messages/conversations/${encodeURIComponent(contactId)}`);
    return await handleResponse(response);
  },

  // Send a message
  sendMessage: async (messageRequest: SendMessageRequest): Promise<{ success: boolean; messageId?: string; message?: InboxMessage; error?: string }> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/messages/send`, {
        method: 'POST',
        body: JSON.stringify(messageRequest),
      });
      return await handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      };
    }
  },

  // Mark conversation as read
  markAsRead: async (contactId: string): Promise<{ success: boolean }> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/messages/conversations/${encodeURIComponent(contactId)}/read`, {
      method: 'POST',
    });
    return await handleResponse(response);
  },

  // Search messages
  searchMessages: async (query: string): Promise<InboxMessage[]> => {
    const url = new URL(`${API_BASE_URL}/api/messages/search`);
    url.searchParams.append('q', query);
    const response = await fetchWithTimeout(url.toString());
    return await handleResponse(response);
  },

  // Delete conversation
  deleteConversation: async (contactId: string): Promise<{ success: boolean }> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/messages/conversations/${encodeURIComponent(contactId)}`, {
      method: 'DELETE',
    });
    return await handleResponse(response);
  },

  // Get unread count
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/messages/unread-count`);
    return await handleResponse(response);
  },

  // Get Instagram user profile
  getInstagramProfile: async (igsid: string, businessId?: string): Promise<{ success: boolean; profile?: InstagramUserProfile; error?: string }> => {
    const url = new URL(`${API_BASE_URL}/api/messages/instagram/profile/${encodeURIComponent(igsid)}`);
    if (businessId) {
      url.searchParams.append('businessId', businessId);
    }
    const response = await fetchWithTimeout(url.toString());
    return await handleResponse(response);
  },

  // Get Instagram auth status
  getInstagramAuthStatus: async (): Promise<{ isAuthenticated: boolean; businesses?: Array<{ businessId: string; isAuthenticated: boolean }> }> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/instagram/status`);
    return await handleResponse(response);
  },

};

export const healthApi = {
  // Health check
  getHealth: async (): Promise<any> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/health`);
    return await handleResponse(response);
  }
};
