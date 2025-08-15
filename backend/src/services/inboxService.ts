import { InboxMessage, Conversation } from '../types/message';
import { v4 as uuidv4 } from 'uuid';

export class InboxService {
  private static instance: InboxService;
  private conversations: Map<string, Conversation> = new Map();

  public static getInstance(): InboxService {
    if (!InboxService.instance) {
      InboxService.instance = new InboxService();
    }
    return InboxService.instance;
  }

  getAllConversations(): Conversation[] {
    return Array.from(this.conversations.values())
      .sort((a, b) => b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime());
  }

  getConversation(contactId: string): Conversation | undefined {
    return this.conversations.get(contactId);
  }

  addMessage(message: InboxMessage): void {
    const contactId = message.direction === 'inbound' ? message.from : message.to;
    let conversation = this.conversations.get(contactId);

    if (!conversation) {
      // Create new conversation
      conversation = {
        id: uuidv4(),
        contactId,
        contactName: message.contactName || contactId,
        lastMessage: message,
        unreadCount: message.direction === 'inbound' ? 1 : 0,
        messages: [message],
        platform: message.platform
      };
    } else {
      // Add message to existing conversation
      conversation.messages.push(message);
      conversation.lastMessage = message;

      if (message.direction === 'inbound') {
        conversation.unreadCount++;
      }
    }

    this.conversations.set(contactId, conversation);
  }

  markConversationAsRead(contactId: string): void {
    const conversation = this.conversations.get(contactId);
    if (conversation) {
      conversation.unreadCount = 0;
      // Mark all inbound messages as read
      conversation.messages.forEach(message => {
        if (message.direction === 'inbound') {
          message.status = 'read';
        }
      });
    }
  }

  getUnreadCount(): number {
    return Array.from(this.conversations.values())
      .reduce((total, conv) => total + conv.unreadCount, 0);
  }

  searchMessages(query: string): InboxMessage[] {
    const results: InboxMessage[] = [];

    this.conversations.forEach(conversation => {
      const matchingMessages = conversation.messages.filter(message =>
        message.content.toLowerCase().includes(query.toLowerCase()) ||
        message.contactName?.toLowerCase().includes(query.toLowerCase())
      );
      results.push(...matchingMessages);
    });

    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  deleteConversation(contactId: string): boolean {
    return this.conversations.delete(contactId);
  }

  updateMessageStatus(messageId: string, status: 'sent' | 'delivered' | 'read' | 'failed'): void {
    this.conversations.forEach(conversation => {
      const message = conversation.messages.find(m => m.id === messageId);
      if (message) {
        message.status = status;
      }
    });
  }
}

export const inboxService = InboxService.getInstance();
