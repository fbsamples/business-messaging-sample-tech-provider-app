import React, { useState } from 'react';
import { InboxMessage } from '../types/message';
import { format } from 'date-fns';
import { Check, CheckCheck, Clock, AlertCircle, Copy } from 'lucide-react';
import clsx from 'clsx';

interface MessageBubbleProps {
  message: InboxMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isOutbound = message.direction === 'outbound';
  const [isHovered, setIsHovered] = useState(false);
  const [showCopiedTooltip, setShowCopiedTooltip] = useState(false);

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <Check size={16} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck size={16} className="text-gray-400" />;
      case 'read':
        return <CheckCheck size={16} className="text-blue-500" />;
      case 'failed':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content || '');
      setShowCopiedTooltip(true);
      setTimeout(() => setShowCopiedTooltip(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleReplyToMessage = () => {
    // This would trigger a reply action - for now just log
    console.log('Reply to message:', message.id);
    // In a real implementation, this would set the message as a reply context
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="space-y-2">
            {message.imageUrl && (
              <img
                src={message.imageUrl}
                alt="Shared image"
                className="max-w-xs rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            {message.content && message.content !== 'Image' && (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
        );

      case 'template':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs text-gray-600 bg-gray-100 rounded px-2 py-1">
              <span>📋</span>
              <span>Template: {message.templateName}</span>
            </div>
            <p className="text-sm">{message.content}</p>
          </div>
        );

      default:
        return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
    }
  };

  return (
    <div className={clsx(
      'flex mb-4 group',
      isOutbound ? 'justify-end' : 'justify-start'
    )}>
      <div className="relative flex items-end space-x-2">
        {/* Copy button - show on hover, positioned on the left for outbound, right for inbound */}
        {isOutbound ? (
          <div className={clsx(
            'flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200',
            'mb-2' // Align with bottom of message bubble
          )}>
            <button
              onClick={handleCopyMessage}
              className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors relative"
              title="Copy message"
            >
              <Copy size={14} />
              {showCopiedTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap">
                  Copied!
                </div>
              )}
            </button>
          </div>
        ) : null}

        {/* Message bubble with hover timestamp */}
        <div className="relative">
          {/* Hover timestamp tooltip - positioned to avoid clipping */}
          <div className={clsx(
            'absolute left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20',
            // Position above for most messages, but below if near the top
            'top-full mt-2'
          )}>
            {format(message.timestamp, 'MMM d, yyyy h:mm:ss a')}
          </div>

          <div
            className={clsx(
              'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
              isOutbound
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-900'
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {renderMessageContent()}

            <div className={clsx(
              'flex items-center justify-between mt-2 text-xs',
              isOutbound ? 'text-blue-100' : 'text-gray-500'
            )}>
              <span>{format(message.timestamp, 'h:mm a')}</span>
              {isOutbound && (
                <div className="ml-2">
                  {getStatusIcon()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Copy button for inbound messages */}
        {!isOutbound ? (
          <div className={clsx(
            'flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200',
            'mb-2' // Align with bottom of message bubble
          )}>
            <button
              onClick={handleCopyMessage}
              className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors relative"
              title="Copy message"
            >
              <Copy size={14} />
              {showCopiedTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap">
                  Copied!
                </div>
              )}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
