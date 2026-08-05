# SEO Strategy — MyKliq

## Product type
Private social networking PWA (web + React Native mobile). Invite-only; requires invite code to join.

## In scope
- Public marketing/acquisition pages: `/`, `/landing`, `/advertiser-requirements`, `/advertiser-onboarding`
- Public legal/trust pages: `/privacy-policy`, `/disclaimer`, `/community-guidelines`, `/terms-of-use`, `/child-safety`, `/contact-us`
- Public auth funnel pages: `/signup`, `/login`, `/forgot-password`
- Structured data and crawlability of the HTML shell

## Out of scope
- Authenticated app pages (`/home`, `/kliq`, `/messages`, `/events`, `/profile`, `/settings`, `/themes`, `/calendar`, `/actions`, `/meetup`, `/scrapbook`, `/reflect`)
- Admin/internal pages (`/support-admin`, `/rules-reports`, `/ads-manager`, `/moviecon-manager`, `/meme-manager`, `/maintenance`)
- Mobile app store SEO (covered in mobile-app-store-optimization.md)

## Rendering mode
Pure React SPA (Vite + Wouter). No SSR, no SSG, no prerender proxy. All crawlers see a single static HTML shell — `client/index.html`.

## Target audience
Young adults seeking private, intimate social sharing with close friends. Not a public content site; discovery is primarily word-of-mouth and referral.

## Primary keywords
- "private social media app"
- "close friends app"
- "invite only social network"
- "friend group app"

## Dismissed categories
- Missing `llms.txt` — not a content site; AI crawler citation is not a primary goal
- HTTPS enforcement — handled automatically by Replit/deployment infrastructure
