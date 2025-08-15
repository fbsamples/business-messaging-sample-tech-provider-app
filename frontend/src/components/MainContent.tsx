import React from 'react';
import { MessageSquare, Instagram } from 'lucide-react';
import { ChatView } from './ChatView';
import { InstagramLogin } from './InstagramLogin';
import { PlatformEmptyState } from './PlatformEmptyState';
import { Conversation } from '../types/message';

type Platform = 'whatsapp' | 'messenger' | 'instagram';

interface MainContentProps {
  instagramAuthState: 'checking' | 'unauthenticated' | 'authenticated';
  selectedPlatform: Platform;
  selectedConversation?: Conversation;
  selectedBusinessId?: string | null;
  onInstagramAuthSuccess: (businessId: string) => void;
  onSendMessage: (
    content: string,
    type: 'text' | 'image' | 'template',
    imageUrl?: string,
    templateName?: string
  ) => Promise<void>;
}

export const MainContent: React.FC<MainContentProps> = ({
  instagramAuthState,
  selectedPlatform,
  selectedConversation,
  selectedBusinessId,
  onInstagramAuthSuccess,
  onSendMessage
}) => {
  // Instagram auth checking state
  if (instagramAuthState === 'checking') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Checking Instagram connection...</p>
        </div>
      </div>
    );
  }

  // Instagram login/dashboard (when no conversation selected)
  if ((instagramAuthState === 'unauthenticated' || instagramAuthState === 'authenticated') &&
      selectedPlatform === 'instagram' && !selectedConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8">
        <div className="max-w-md w-full">
          <InstagramLogin
            onAuthSuccess={onInstagramAuthSuccess}
            selectedBusinessId={selectedBusinessId || undefined}
            isConnected={instagramAuthState === 'authenticated'}
          />
        </div>
      </div>
    );
  }

  // Platform empty states
  if (selectedPlatform === 'whatsapp') {
    return (
      <div className="flex-1 flex flex-col">
        <PlatformEmptyState platform="whatsapp" />
      </div>
    );
  }

  if (selectedPlatform === 'messenger') {
    return (
      <div className="flex-1 flex flex-col">
        <PlatformEmptyState platform="messenger" />
      </div>
    );
  }

  // Active Instagram conversation
  if (selectedConversation && selectedPlatform === 'instagram') {
    return (
      <div className="flex-1 flex flex-col">
        <ChatView
          conversation={selectedConversation}
          onSendMessage={onSendMessage}
          loading={false}
        />
      </div>
    );
  }

  // Default welcome state
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <MessageSquare size={64} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">
          Welcome to Messaging Inbox
        </h2>
        <p className="text-gray-500">
          Select an Instagram conversation from the sidebar to start messaging
        </p>
        {selectedBusinessId && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-green-700">
              <Instagram className="w-5 h-5" />
              <span className="font-medium">Instagram Connected</span>
            </div>
            <p className="text-sm text-green-600 mt-1">Ready to receive and send messages</p>
          </div>
        )}
      </div>
    </div>
  );
};
