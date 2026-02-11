
import React from 'react';
import { Message, Sender } from '../types';
import BotAvatar from './BotAvatar';

interface ChatBubbleProps {
  message: Message;
}

const renderFormattedText = (text: React.ReactNode): React.ReactNode => {
    if (typeof text !== 'string') {
        return text;
    }

    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => (
        <React.Fragment key={lineIndex}>
            {line.split(/(\*\*.*?\*\*)/g).map((part, partIndex) => 
                part.startsWith('**') && part.endsWith('**') ? (
                    <strong key={partIndex} className="text-blue-900 font-bold">{part.slice(2, -2)}</strong>
                ) : (
                    part
                )
            )}
            {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
    ));
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.sender === Sender.USER;

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      {!isUser && <BotAvatar />}
      <div
        className={`max-w-[90%] md:max-w-[85%] lg:max-w-[75%] rounded-2xl px-4 md:px-5 py-2.5 md:py-3 shadow-sm border ${
          isUser
            ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none'
            : 'bg-white text-slate-800 border-slate-200 rounded-tl-none'
        }`}
      >
        <div className="prose prose-sm max-w-none text-inherit leading-relaxed font-medium">{renderFormattedText(message.text)}</div>
      </div>
    </div>
  );
};

export default ChatBubble;
