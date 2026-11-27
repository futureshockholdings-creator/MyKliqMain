import { useEffect, useState } from 'react';
import { findSocialMediaUrls } from '@/lib/socialMediaUtils';
import { isTikTokShortLink, tikTokVideoId } from '@shared/tiktok';
import { TikTokPlayer } from './TikTokPlayer';
import { uiText, useUiLanguage } from '@/i18n/interfaceText';

export function TikTokDraftPreviews({ text }: { text: string }) {
  useUiLanguage();
  const [settledText, setSettledText] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSettledText(text), 650);
    return () => clearTimeout(timer);
  }, [text]);
  const current = new Set(findSocialMediaUrls(text).map(link => link.url));
  const urls = [...new Set(findSocialMediaUrls(settledText)
    .filter(link => link.platform === 'tiktok' &&
      (tikTokVideoId(link.url) || isTikTokShortLink(link.url)))
    .map(link => link.url))].filter(url => current.has(url));
  if (!urls.length) return null;
  return (
    <div className="mb-3 space-y-3 min-w-0">
      {urls.slice(0, 3).map(url => (
        <TikTokPlayer key={url} url={url} className="w-full max-w-sm mx-auto" />
      ))}
      {urls.length > 3 && <p className="text-sm text-muted-foreground">
        {uiText('Additional TikTok links will appear after posting.')}
      </p>}
    </div>
  );
}
