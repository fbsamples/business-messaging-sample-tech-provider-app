// Instagram-specific types
export interface InstagramSendMessageRequest {
  to: string; // Instagram-scoped ID (IGSID)
  type: 'text' | 'image' | 'template';
  content: string;
  imageUrl?: string;
  templateName?: string;
}

export interface InstagramSendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface InstagramUserProfileResponse {
  success: boolean;
  profile?: InstagramUserProfile;
  error?: string;
}

export interface InstagramUserProfile {
  name: string;
  username: string;
  profile_pic: string;
  follower_count: number;
  is_user_follow_business: boolean;
  is_business_follow_user: boolean;
}

export interface InstagramWebhookEntry {
  id: string;
  time: number;
  messaging?: InstagramWebhookMessage[];
}

export interface InstagramWebhookMessage {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: Array<{
      type: string;
      payload: {
        url: string;
      };
    }>;
  };
}

export interface InstagramAuthStatus {
  isAuthenticated: boolean;
  businesses?: Array<{
    businessId: string;
    isAuthenticated: boolean;
    expiresAt?: string;
  }>;
}
