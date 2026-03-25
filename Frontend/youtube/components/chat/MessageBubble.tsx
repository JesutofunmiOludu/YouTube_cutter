import React from 'react';
import { Avatar } from '../ui/Avatar';

export interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  userAvatar?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  role,
  content,
  createdAt,
  userAvatar,
}) => {
  const isUser = role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`shrink-0 ${isUser ? 'ml-4' : 'mr-4'}`}>
          <Avatar 
            src={isUser ? userAvatar : '/bot-avatar.png'} 
            fallback={isUser ? 'U' : 'AI'} 
          />
        </div>
        
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div 
            className={`px-4 py-3 rounded-2xl ${
              isUser 
                ? 'bg-blue-500 text-white rounded-tr-sm' 
                : 'bg-gray-800 border border-gray-700 text-gray-50 rounded-tl-sm'
            }`}
          >
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {content}
            </div>
          </div>
          <span className="text-xs text-gray-500 mt-1 mx-1 font-mono">
            {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};
