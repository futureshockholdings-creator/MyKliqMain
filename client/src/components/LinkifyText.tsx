import React from 'react';

interface LinkifyTextProps {
  text: string;
  className?: string;
}

export function LinkifyText({ text, className = '' }: LinkifyTextProps) {
  if (!text) return null;

  const urlPattern = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
  const parts = text.split(urlPattern);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isUrl = /^https?:\/\//i.test(part);
        if (isUrl) {
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
