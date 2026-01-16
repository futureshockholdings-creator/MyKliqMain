import React from 'react';

interface LinkifyTextProps {
  text: string;
  className?: string;
}

const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;

export function LinkifyText({ text, className = '' }: LinkifyTextProps) {
  if (!text) return null;

  const parts = text.split(urlRegex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (urlRegex.test(part)) {
          urlRegex.lastIndex = 0;
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
}
