import { InstagramUserProfile } from './instagram';

export interface Contact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export interface MessageText {
  body: string;
}

export interface MessageImage {
  caption?: string;
  mime_type: string;
  sha256: string;
  id: string;
}

export interface MessageTemplate {
  name: string;
  language: {
    code: string;
  };
  components?: Array<{
    type: string;
    parameters: Array<{
      type: string;
      text?: string;
      image?: {
        link: string;
      };
    }>;
  }>;
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: MessageText;
  image?: MessageImage;
  template?: MessageTemplate;
  type: 'text' | 'image' | 'template';
}

export interface WebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      contacts?: Contact[];
      messages?: WhatsAppMessage[];
      statuses?: Array<{
        id: string;
        status: string;
        timestamp: string;
        recipient_id: string;
      }>;
    };
    field: string;
  }>;
}

export interface WebhookPayload {
  object: string;
  entry: WebhookEntry[];
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
  text?: {
    body: string;
  };
  image?: {
    link: string;
    caption?: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text?: string;
        image?: {
          link: string;
        };
      }>;
    }>;
  };
}
