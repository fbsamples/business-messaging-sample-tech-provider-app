export interface InstagramUserProfile {
  name: string;
  username: string;
  profile_pic: string;
  follower_count: number;
  is_user_follow_business: boolean;
  is_business_follow_user: boolean;
}

export interface InboxMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  type: 'text' | 'image' | 'template';
  timestamp: Date;
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  platform: 'whatsapp' | 'instagram' | 'messenger';
  imageUrl?: string;
  templateName?: string;
  contactName?: string;
  instagramProfile?: InstagramUserProfile;
}

export interface Conversation {
  id: string;
  contactId: string; // Generic contact identifier (phone number for WhatsApp, IGSID for Instagram, etc.)
  contactName: string;
  lastMessage: InboxMessage;
  unreadCount: number;
  messages: InboxMessage[];
  platform: 'whatsapp' | 'instagram' | 'messenger'; // Track which platform this conversation belongs to
}

export interface SendMessageRequest {
  to: string;
  type: 'text' | 'image' | 'template';
  platform: 'whatsapp' | 'instagram' | 'messenger';
  content: string;
  imageUrl?: string;
  templateName?: string;
  businessId?: string;
  languageCode?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
