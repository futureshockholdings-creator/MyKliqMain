import { useMemo } from 'react';
import { Link } from 'wouter';
import { LinkifyText } from '@/components/LinkifyText';
import { YouTubeEmbedList } from '@/components/YouTubeEmbed';
import { TwitchEmbedList } from '@/components/TwitchEmbed';
import { SocialMediaEmbedList } from '@/components/SocialMediaEmbed';
import { LinkPreviewList } from '@/components/LinkPreviewCard';
import { extractYouTubeUrlsFromText } from '@/lib/youtubeUtils';
import { extractTwitchUrlsFromText } from '@/lib/twitchUtils';
import { extractSocialMediaUrlsFromText } from '@/lib/socialMediaUtils';
import { extractGenericUrlsFromText } from '@/lib/linkPreviewUtils';

interface PostContentWithEmbedsProps {
  content: string;
  translateFn: (text: string) => string;
  textClassName?: string;
  embedSpacing?: string;
}

export function PostContentWithEmbeds({
  content,
  translateFn,
  textClassName = "text-foreground mb-3 whitespace-pre-wrap",
  embedSpacing = "mb-3",
}: PostContentWithEmbedsProps) {
  const { cleanText, youtubeUrls, twitchUrls, socialUrls, genericUrls } = useMemo(() => {
    const { cleanText: ytClean, youtubeUrls } = extractYouTubeUrlsFromText(content);
    const { cleanText: twClean, twitchUrls } = extractTwitchUrlsFromText(ytClean);
    const { cleanText: smClean, socialUrls } = extractSocialMediaUrlsFromText(twClean);
    const { cleanText, genericUrls } = extractGenericUrlsFromText(smClean || '');
    return { cleanText, youtubeUrls, twitchUrls, socialUrls, genericUrls };
  }, [content]);

  const isEventPost = cleanText?.includes('📅 New event:') || cleanText?.includes('✏️ Updated event:');

  return (
    <>
      {cleanText && (
        isEventPost ? (
          <Link href="/events" className="block cursor-pointer hover:bg-primary/5 rounded p-2 -m-2 transition-colors">
            <p className={textClassName}>{translateFn(cleanText)}</p>
            <p className="text-xs text-muted-foreground italic">Click to view event details and manage attendance</p>
          </Link>
        ) : (
          <p className={textClassName}>
            <LinkifyText text={translateFn(cleanText)} />
          </p>
        )
      )}
      {youtubeUrls.length > 0 && (
        <div className={embedSpacing}>
          <YouTubeEmbedList urls={youtubeUrls} />
        </div>
      )}
      {twitchUrls.length > 0 && (
        <div className={embedSpacing}>
          <TwitchEmbedList urls={twitchUrls} />
        </div>
      )}
      {socialUrls.length > 0 && (
        <div className={embedSpacing}>
          <SocialMediaEmbedList urls={socialUrls} />
        </div>
      )}
      {genericUrls.length > 0 && (
        <div className={embedSpacing}>
          <LinkPreviewList urls={genericUrls} />
        </div>
      )}
    </>
  );
}

interface CommentContentWithEmbedsProps {
  content: string;
  translateFn: (text: string) => string;
}

export function CommentContentWithEmbeds({ content, translateFn }: CommentContentWithEmbedsProps) {
  const { cleanText, youtubeUrls, twitchUrls, socialUrls, genericUrls } = useMemo(() => {
    const { cleanText: ytClean, youtubeUrls } = extractYouTubeUrlsFromText(content);
    const { cleanText: twClean, twitchUrls } = extractTwitchUrlsFromText(ytClean);
    const { cleanText: smClean, socialUrls } = extractSocialMediaUrlsFromText(twClean);
    const { cleanText, genericUrls } = extractGenericUrlsFromText(smClean || '');
    return { cleanText, youtubeUrls, twitchUrls, socialUrls, genericUrls };
  }, [content]);

  return (
    <>
      {cleanText && <p className="text-sm text-foreground">{translateFn(cleanText)}</p>}
      {youtubeUrls.length > 0 && (
        <div className="mt-2">
          <YouTubeEmbedList urls={youtubeUrls} />
        </div>
      )}
      {twitchUrls.length > 0 && (
        <div className="mt-2">
          <TwitchEmbedList urls={twitchUrls} />
        </div>
      )}
      {socialUrls.length > 0 && (
        <div className="mt-2">
          <SocialMediaEmbedList urls={socialUrls} />
        </div>
      )}
      {genericUrls.length > 0 && (
        <div className="mt-2">
          <LinkPreviewList urls={genericUrls} />
        </div>
      )}
    </>
  );
}
