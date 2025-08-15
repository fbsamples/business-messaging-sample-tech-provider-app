import { useState, useEffect } from 'react';
import { Conversation } from './types/message';
import { ConversationList } from './components/ConversationList';
import { ErrorToast } from './components/ErrorToast';
import { PlatformTabs } from './components/PlatformTabs';
import { MainContent } from './components/MainContent';
import { InboxHeader } from './components/InboxHeader';
import { NewConversationButton } from './components/NewConversationButton';
import { ErrorScreen } from './components/ErrorScreen';
import { useInstagramAuth } from './hooks/useInstagramAuth';
import { messageApi } from './services/api';

type Platform = 'whatsapp' | 'messenger' | 'instagram';

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('instagram');

  // Use hook for Instagram auth
  const { authState: instagramAuthState, selectedBusinessId, handleAuthSuccess: handleInstagramAuthSuccess } = useInstagramAuth();

  // Initial load after Instagram auth is checked
  useEffect(() => {
    if (instagramAuthState === 'authenticated') {
      loadConversations();
    }
  }, [instagramAuthState]);

  // Polling frequency
  useEffect(() => {
    const pollInterval = setInterval(() => {
      loadConversations(false);
    }, selectedConversation ? 1000 : 3000); // 1s when active(selected a conversation), 3s when idle(no conversation selected)

    return () => clearInterval(pollInterval);
  }, [!!selectedConversation]);

  const loadConversations = async (showLoading = true) => {
    try {
      const data = await messageApi.getConversations();
      setConversations(data);

      // Only update selected conversation with new messages, don't change selection
      setSelectedConversation(prev => {
        if (!prev) return prev;

        const updatedConversation = data.find(c => c.contactId === prev.contactId);
        if (updatedConversation) {
          // Auto-mark as read if there are new messages
          if (updatedConversation.messages.length !== prev.messages.length) {
            messageApi.markAsRead(prev.contactId).catch(console.error);
          }
          return updatedConversation;
        } else {
          // Conversation no longer exists
          return undefined;
        }
      });

      setError(null);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      if (showLoading) setError('Failed to load conversations');
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    if (!selectedBusinessId) {
      console.error('No business ID available for Instagram');
      return;
    }

    setSelectedConversation(conversation);

    // Mark as read
    try {
      await messageApi.markAsRead(conversation.contactId);
      setConversations(prev =>
        prev.map(conv =>
          conv.contactId === conversation.contactId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleSendMessage = async (
    content: string,
    type: 'text' | 'image' | 'template',
    imageUrl?: string,
    templateName?: string
  ) => {
    if (!selectedConversation) {
      setErrorToast('No conversation selected');
      return;
    }

    try {
      const result = await messageApi.sendMessage({
        to: selectedConversation.contactId,
        type,
        platform: 'instagram',
        content,
        imageUrl,
        templateName,
        businessId: selectedBusinessId || undefined
      });

      if (result.success && result.message) {
        // Update conversations
        setConversations(prev =>
          prev.map(conv =>
            conv.contactId === selectedConversation.contactId
              ? { ...conv, messages: [...conv.messages, result.message!], lastMessage: result.message! }
              : conv
          )
        );

        // Update selected conversation
        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, result.message!],
          lastMessage: result.message!
        } : prev);
      } else {
        setErrorToast(result.error || 'Failed to send message');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setErrorToast(errorMessage);
      throw err;
    }
  };

  const handleNewConversation = () => {
    alert('New conversations will appear automatically when customers message you through Instagram');
  };

  // Default page if any errors occur
  if (error) {
    return (
      <ErrorScreen
        error={error}
        onRetry={() => {
          setError(null);
          loadConversations();
        }}
      />
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {errorToast && (
        <ErrorToast
          message={errorToast}
          onClose={() => setErrorToast(null)}
          duration={8000}
        />
      )}

      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header, contains settings button(not implemented) */}
        <InboxHeader
          onSettingsClick={() => alert('Settings coming soon!')}
        />

        {/* Platform Tabs(toggle between IG, Messenger, Whatsapp tabs) */}
        <PlatformTabs
          selectedPlatform={selectedPlatform}
          onSelectPlatform={setSelectedPlatform}
        />

        {/* New conversation button, not really effective right now */}
        <NewConversationButton
          onClick={handleNewConversation}
        />

        {/* Conversations Sidebar On Left */}
        <ConversationList
          conversations={selectedPlatform === 'instagram' ? conversations.filter(conv => conv.lastMessage.platform === 'instagram') : []}
          selectedConversation={selectedPlatform === 'instagram' ? selectedConversation : undefined}
          onSelectConversation={handleSelectConversation}
          loading={false}
        />
      </div>

      {/* Main Chat Area / Login Window */}
      <MainContent
        instagramAuthState={instagramAuthState}
        selectedPlatform={selectedPlatform}
        selectedConversation={selectedConversation}
        selectedBusinessId={selectedBusinessId}
        onInstagramAuthSuccess={handleInstagramAuthSuccess}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}

export default App;
