import React from 'react';
import { Settings, Plus, MessageSquare } from 'lucide-react';

interface InboxHeaderProps {
  onSettingsClick?: () => void;
  onNewMessageClick?: () => void;
}

export const InboxHeader: React.FC<InboxHeaderProps> = ({
  onSettingsClick,
  onNewMessageClick
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
      <div className="flex items-center space-x-2">
        <MessageSquare className="text-green-500" size={20} />
        <h1 className="text-xl font-semibold text-gray-800">Messages</h1>
      </div>
      <div className="flex items-center space-x-2">
        {onNewMessageClick && (
          <button
            onClick={onNewMessageClick}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="New Message"
          >
            <Plus size={20} />
          </button>
        )}
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        )}
      </div>
    </div>
  );
};
