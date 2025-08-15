import React from 'react';
import { MessageSquare, MessageCircle } from 'lucide-react';

type Platform = 'whatsapp' | 'messenger';

interface PlatformEmptyStateProps {
  platform: Platform;
}

export const PlatformEmptyState: React.FC<PlatformEmptyStateProps> = ({ platform }) => {
  const config = {
    whatsapp: {
      icon: MessageSquare,
      title: 'WhatsApp Integration',
      description: 'WhatsApp integration is coming soon',
      colors: {
        icon: 'text-green-400',
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700'
      }
    },
    messenger: {
      icon: MessageCircle,
      title: 'Messenger Integration',
      description: 'Messenger integration is coming soon',
      colors: {
        icon: 'text-blue-400',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700'
      }
    }
  };

  const { icon: Icon, title, description, colors } = config[platform];

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Icon size={64} className={`mx-auto ${colors.icon} mb-4`} />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">
          {title}
        </h2>
        <p className="text-gray-500 mb-4">
          {description}
        </p>
        <div className={`p-4 ${colors.bg} border ${colors.border} rounded-lg max-w-md`}>
          <p className={`text-sm ${colors.text}`}>
            This feature is not yet implemented. Switch to Instagram to start messaging.
          </p>
        </div>
      </div>
    </div>
  );
};
