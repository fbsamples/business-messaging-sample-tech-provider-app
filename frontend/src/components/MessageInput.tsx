import React, { useState } from 'react';
import { Send, Image, FileText, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface MessageInputProps {
  onSendMessage: (content: string, type: 'text' | 'image' | 'template', imageUrl?: string, templateName?: string) => Promise<void>;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'image' | 'template'>('text');
  const [imageUrl, setImageUrl] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() && messageType === 'text') return;
    if (messageType === 'image' && !imageUrl.trim()) return;
    if (messageType === 'template' && !templateName.trim()) return;

    setSending(true);

    try {
      await onSendMessage(message, messageType, imageUrl || undefined, templateName || undefined);
      setMessage('');
      setImageUrl('');
      setTemplateName('');
      setMessageType('text');
    } catch (error) {
      // Error is already logged in parent component (App.tsx)
      // Just handle the UI state here
    } finally {
      setSending(false);
    }
  };

  const renderInputFields = () => {
    switch (messageType) {
      case 'image':
        return (
          <div className="space-y-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter image URL..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={disabled || sending}
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a caption (optional)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              disabled={disabled || sending}
            />
          </div>
        );

      case 'template':
        return (
          <div className="space-y-2">
            <select
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={disabled || sending}
            >
              <option value="">Select a template...</option>
              <option value="order_confirmation">Order Confirmation</option>
              <option value="shipping_update">Shipping Update</option>
              <option value="delivery_notification">Delivery Notification</option>
              <option value="payment_reminder">Payment Reminder</option>
              <option value="support_ticket">Support Ticket</option>
            </select>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Template message content..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              disabled={disabled || sending}
            />
          </div>
        );

      default:
        return (
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            disabled={disabled || sending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        );
    }
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Message type selector */}
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setMessageType('text')}
            className={clsx(
              'flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors',
              messageType === 'text'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
            disabled={disabled || sending}
          >
            <Send size={16} />
            <span>Text</span>
          </button>

          <button
            type="button"
            onClick={() => setMessageType('image')}
            className={clsx(
              'flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors',
              messageType === 'image'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
            disabled={disabled || sending}
          >
            <Image size={16} />
            <span>Image</span>
          </button>

          <button
            type="button"
            onClick={() => setMessageType('template')}
            className={clsx(
              'flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors',
              messageType === 'template'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
            disabled={disabled || sending}
          >
            <FileText size={16} />
            <span>Template</span>
          </button>
        </div>

        {/* Input fields */}
        {renderInputFields()}

        {/* Send button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={
              disabled ||
              sending ||
              (!message.trim() && messageType === 'text') ||
              (messageType === 'image' && !imageUrl.trim()) ||
              (messageType === 'template' && !templateName.trim())
            }
            className={clsx(
              'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              'bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            <span>{sending ? 'Sending...' : 'Send'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
