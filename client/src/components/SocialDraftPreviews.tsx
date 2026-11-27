import { useEffect, useState } from 'react';
import { findSocialMediaUrls } from '@/lib/socialMediaUtils';
import { isTikTokShortLink, tikTokVideoId } from '@shared/tiktok';
import { facebookEmbedTarget, isFacebookShareUrl } from '@shared/facebook';
import { TikTokPlayer } from './TikTokPlayer';
import { FacebookEmbed } from './FacebookEmbed';
import { uiText, useUiLanguage } from '@/i18n/interfaceText';

export function SocialDraftPreviews({ text }: { text: string }) {
  useUiLanguage();
  const [settledText, setSettledText] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSettledText(text), 650);
    return () => clearTimeout(timer);
  }, [text]);
  const current = new Set(findSocialMediaUrls(text).map(link => link.url));
  const seen = new Set<string>();
  const links = findSocialMediaUrls(settledText).filter(link => {
    const supported = link.platform === 'tiktok'
      ? tikTokVideoId(link.url) || isTikTokShortLink(link.url)
      : link.platform === 'facebook' && (facebookEmbedTarget(link.url) || isFacebookShareUrl(link.url));
    if (!supported || !current.has(link.url) || seen.has(link.url)) return false;
    seen.add(link.url);
    return true;
  });
  if (!links.length) return null;
  return (
    <div className="mb-3 space-y-3 min-w-0">
      {links.slice(0, 3).map(link => link.platform === 'facebook'
        ? <FacebookEmbed key={link.url} url={link.url} className="w-full max-w-sm mx-auto" />
        : <TikTokPlayer key={link.url} url={link.url} className="w-full max-w-sm mx-auto" />)}
      {links.length > 3 && <p className="text-sm text-muted-foreground">
        {uiText('Additional links will appear after posting.')}
      </p>}
    </div>
  );
}
