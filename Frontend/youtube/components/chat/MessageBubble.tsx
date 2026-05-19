import React from 'react';
import Avatar from '../ui/Avatar';
import type { ChatMessage, User } from '@/types';

export interface MessageBubbleProps {
  message: ChatMessage;
  user?: User | null;
  onSeek?: (seconds: number) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  user,
  onSeek,
}) => {
  const isUser = message.role === 'user';
  // Fallback to current time if created_at is missing
  const createdAt = (message as any).created_at || (message as any).createdAt || new Date().toISOString();

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`shrink-0 ${isUser ? 'ml-4' : 'mr-4'}`}>
          <Avatar 
            src={isUser ? user?.avatar_url : '/bot-avatar.png'}
          />
        </div>
        
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div 
            className={`px-4 py-3 ${
              isUser 
                ? 'bg-primary-600 text-[color:var(--color-text-inverse)] rounded-2xl rounded-tr-sm shadow-sm' 
                : 'bg-[var(--color-bg-secondary)] border border-[color:var(--color-border-secondary)] text-[color:var(--color-text-primary)] rounded-2xl rounded-tl-sm shadow-sm'
            }`}
          >
            <div className="text-body-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
          <span className="text-caption text-[color:var(--color-text-tertiary)] mt-1 mx-1 font-mono">
           {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export const TypingIndicator: React.FC = () => (
  <div className="flex w-full mb-6 justify-start">
    <div className="flex max-w-[80%] flex-row">
      <div className="shrink-0 mr-4">
        <Avatar src="/bot-avatar.png" />
      </div>
      <div className="flex flex-col items-start justify-center">
        <div className="px-4 py-3 bg-[var(--color-bg-secondary)] border border-[color:var(--color-border-secondary)] rounded-2xl rounded-tl-sm h-10 flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  </div>
);
