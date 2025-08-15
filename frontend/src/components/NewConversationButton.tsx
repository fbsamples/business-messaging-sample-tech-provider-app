import React from 'react';
import { Plus } from 'lucide-react';

interface NewConversationButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const NewConversationButton: React.FC<NewConversationButtonProps> = ({
  onClick,
  disabled = false
}) => {
  return (
    <div className="p-4 border-b border-gray-200">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
          disabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        <Plus size={16} />
        <span>New Conversation</span>
      </button>
    </div>
  );
};
