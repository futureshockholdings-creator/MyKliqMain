import { useState } from 'react';
import { Play } from 'lucide-react';
import type { TwitchUrl } from '@/lib/twitchUtils';
import { getTwitchStreamThumbnail, getTwitchEmbedUrl } from '@/lib/twitchUtils';

function TwitchIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
    </svg>
  );
}

interface TwitchEmbedProps {
  twitchUrl: TwitchUrl;
  className?: string;
}

export function TwitchEmbed({ twitchUrl, className = "" }: TwitchEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const embedUrl = getTwitchEmbedUrl(twitchUrl);

  const thumbnailUrl = twitchUrl.contentType === 'stream'
    ? getTwitchStreamThumbnail(twitchUrl.identifier)
    : null;

  const contentLabel = twitchUrl.contentType === 'stream'
    ? twitchUrl.identifier
    : twitchUrl.contentType === 'clip'
      ? 'Clip'
      : `Video ${twitchUrl.identifier}`;

  if (!isPlaying) {
    return (
      <div
        className={`relative cursor-pointer group rounded-lg overflow-hidden bg-[#0e0e10] ${className}`}
        onClick={() => setIsPlaying(true)}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`Twitch ${twitchUrl.contentType}`}
            className="w-full aspect-video object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full aspect-video bg-gradient-to-br from-[#9146FF] to-[#0e0e10]" />
        )}

        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="bg-[#9146FF] hover:bg-[#7c3aed] transition-colors rounded-full p-4 group-hover:scale-110 transform transition-transform">
            <Play className="w-8 h-8 text-white fill-current ml-1" />
          </div>
        </div>

        <div className="absolute top-2 right-2 bg-[#9146FF] text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <TwitchIcon className="w-3 h-3" />
          Twitch
        </div>

        <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {contentLabel}
        </div>

        {twitchUrl.contentType === 'stream' && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wide">
            Live
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <iframe
        src={embedUrl}
        title={`Twitch ${twitchUrl.contentType}`}
        allowFullScreen
        className="w-full aspect-video"
      />
    </div>
  );
}

interface TwitchEmbedListProps {
  urls: TwitchUrl[];
  className?: string;
}

export function TwitchEmbedList({ urls, className = "" }: TwitchEmbedListProps) {
  if (!urls || urls.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {urls.map((twitchUrl, index) => (
        <TwitchEmbed
          key={`${twitchUrl.url}-${index}`}
          twitchUrl={twitchUrl}
          className="w-full max-w-2xl"
        />
      ))}
    </div>
  );
}
