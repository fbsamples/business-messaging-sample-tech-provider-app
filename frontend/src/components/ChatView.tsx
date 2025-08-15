import React, { useEffect, useRef } from 'react';
import { Conversation } from '../types/message';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Phone, MoreVertical, MessageSquare, Instagram, MessageCircle } from 'lucide-react';

interface ChatViewProps {
  conversation: Conversation;
  onSendMessage: (content: string, type: 'text' | 'image' | 'template', imageUrl?: string, templateName?: string) => Promise<void>;
  loading?: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  onSendMessage,
  loading = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Debug: Log when conversation prop changes (only when message count changes)
  useEffect(() => {
    console.log('🔄 ChatView received conversation update:', {
      contactId: conversation.contactId,
      messageCount: conversation.messages.length,
      lastMessageContent: conversation.messages[conversation.messages.length - 1]?.content?.substring(0, 50) + '...'
    });
  }, [conversation.messages.length]); // Only log when message count changes

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Profile picture or platform icon */}
            {conversation.lastMessage.platform === 'instagram' &&
             conversation.lastMessage.instagramProfile?.profile_pic ? (
              <img
                src={conversation.lastMessage.instagramProfile.profile_pic}
                alt={conversation.lastMessage.instagramProfile.name || conversation.lastMessage.instagramProfile.username}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  // Fallback to default Instagram icon if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium bg-pink-500">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </div>
                    `;
                  }
                }}
              />
            ) : (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                conversation.lastMessage.platform === 'whatsapp' ? 'bg-green-500' :
                conversation.lastMessage.platform === 'instagram' ? 'bg-pink-500' :
                conversation.lastMessage.platform === 'messenger' ? 'bg-blue-500' :
                'bg-gray-500'
              }`}>
                {conversation.lastMessage.platform === 'whatsapp' && <MessageSquare size={18} />}
                {conversation.lastMessage.platform === 'instagram' && <Instagram size={18} />}
                {conversation.lastMessage.platform === 'messenger' && <MessageCircle size={18} />}
                {conversation.lastMessage.platform !== 'whatsapp' &&
                 conversation.lastMessage.platform !== 'instagram' &&
                 conversation.lastMessage.platform !== 'messenger' && <Phone size={18} />}
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {conversation.lastMessage.platform === 'instagram' && conversation.lastMessage.instagramProfile ?
                  (conversation.lastMessage.instagramProfile.name || conversation.lastMessage.instagramProfile.username) :
                  conversation.contactName
                }
              </h2>
              <p className="text-sm text-gray-500">
                {conversation.lastMessage.platform === 'instagram' && conversation.lastMessage.instagramProfile ?
                  `@${conversation.lastMessage.instagramProfile.username}` :
                  conversation.contactId
                }
              </p>
            </div>
          </div>

          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : (
          <>
            {conversation.messages.map((message, index) => (
              <MessageBubble key={`${message.id}-${message.timestamp}-${index}`} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input */}
      <MessageInput onSendMessage={onSendMessage} disabled={loading} />
    </div>
  );
};
