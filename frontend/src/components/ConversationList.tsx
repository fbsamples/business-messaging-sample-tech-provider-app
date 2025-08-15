import React, { useState, useMemo } from 'react';
import { Conversation } from '../types/message';
import { formatDistanceToNow } from 'date-fns';
import { Instagram, Search, MessageCircle } from 'lucide-react';
import clsx from 'clsx';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation?: Conversation;
  onSelectConversation: (conversation: Conversation) => void;
  loading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Simple search - only contact name and last message
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter(conversation => 
      conversation.contactName?.toLowerCase().includes(query) ||
      conversation.lastMessage.content?.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Simple Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
          <MessageCircle size={48} className="mb-4 opacity-50" />
          <p className="text-center">No conversations yet. New Instagram messages will appear here.</p>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
          <Search size={48} className="mb-4 opacity-50" />
          <p className="text-center">No conversations match "{searchQuery}"</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation, index) => (
            <div
              key={`${conversation.id}-${conversation.contactId}-${index}`}
              onClick={() => onSelectConversation(conversation)}
              className={clsx(
                'p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors',
                selectedConversation?.id === conversation.id && 'bg-blue-50'
              )}
            >
              <div className="flex items-start space-x-3">
                {/* Avatar with proper fallback */}
                <div className="flex-shrink-0">
                  {conversation.lastMessage.instagramProfile?.profile_pic ? (
                    <img
                      src={conversation.lastMessage.instagramProfile.profile_pic}
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        // Replace failed image with Instagram icon
                        const img = e.target as HTMLImageElement;
                        const parent = img.parentElement!;
                        parent.innerHTML = `
                          <div class="w-12 h-12 rounded-full flex items-center justify-center bg-pink-500 text-white">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-pink-500 text-white">
                      <Instagram size={20} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Contact Info */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {conversation.lastMessage.instagramProfile?.name || 
                       conversation.lastMessage.instagramProfile?.username ||
                       conversation.contactName}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {conversation.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(conversation.lastMessage.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Last Message */}
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {conversation.lastMessage.direction === 'outbound' && (
                      <span className="text-blue-600 mr-1">You: </span>
                    )}
                    {conversation.lastMessage.type === 'image' ? '📷 Image' : 
                     conversation.lastMessage.type === 'template' ? '📋 Template' :
                     conversation.lastMessage.content}
                  </p>

                  {/* Instagram Handle */}
                  {conversation.lastMessage.instagramProfile?.username && (
                    <span className="text-xs text-gray-400 mt-1 block">
                      @{conversation.lastMessage.instagramProfile.username}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};