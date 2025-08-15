import React from 'react';
import { MessageSquare, Instagram, MessageCircle } from 'lucide-react';

type Platform = 'whatsapp' | 'messenger' | 'instagram';

interface PlatformTabsProps {
  selectedPlatform: Platform;
  onSelectPlatform: (platform: Platform) => void;
}

export const PlatformTabs: React.FC<PlatformTabsProps> = ({
  selectedPlatform,
  onSelectPlatform
}) => {
  const platforms = [
    { id: 'instagram' as Platform, icon: Instagram, label: 'Instagram', color: 'pink' },
    { id: 'whatsapp' as Platform, icon: MessageSquare, label: 'WhatsApp', color: 'green' },
    { id: 'messenger' as Platform, icon: MessageCircle, label: 'Messenger', color: 'blue' },
  ];

  return (
    <div className="px-4 py-2 border-b border-gray-200">
      <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
        {platforms.map(({ id, icon: Icon, label, color }) => (
          <button
            key={id}
            onClick={() => onSelectPlatform(id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              selectedPlatform === id
                ? `bg-${color}-100 text-${color}-700`
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
