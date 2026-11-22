# PWA language coverage

## Scope and review method

This implementation covers the existing web/PWA interface in English, Spanish,
French, German, Brazilian Portuguese, Italian, Simplified Chinese, Japanese,
Korean, and Arabic. It does not change the language list or the separate native
mobile application.

Review was source-based only. No automated tests, browser sessions, screenshots,
builds or typechecks were run, at the user's request. A source inventory and
catalog reconciliation are not proof of correct rendering on a device.

## Catalogs and language behavior

- 3,005 base interface messages are available in each language, in addition to
  the original navigation/common translation resources.
- Catalogs have additional count forms appropriate to each language. English
  has 3,059 total entries; Arabic has 3,167. Different plural-entry totals are
  intentional, not missing translations.
- Source review reconciled base keys across all ten languages and interpolation
  placeholders across base and plural entries.
- Saved language preference takes priority over browser detection.
- Regional language codes resolve to the existing base languages.
- Components subscribe to language changes without keying/remounting the page,
  so switching language does not intentionally discard unfinished forms.
- Public pages now expose the existing language selector, including access to
  the English source of policy documents.
- Catalogs load as bundled language chunks, not through a paid translation API.
  A first switch needs that language's chunk; the existing worker caches fetched
  assets. A language never downloaded cannot be promised to work offline.
- Document language/direction and shared tabs/select/menu direction respond to
  Arabic. Identifier inputs remain left-to-right.
- Display formatting is separate from API/storage formats. Calendar transport
  dates, IDs, enum values, routes and the timezone parser remain unchanged.

## Page coverage

All 33 page modules were included in the source migration and review. Shared
dialogs and controls are included even when the page delegates its interface to
a component.

| Page | Included interface |
| --- | --- |
| Landing | Marketing copy, navigation actions and recovery links |
| Login | Headings, fields, account links and validation presentation |
| Signup | Steps, profile/security choices, instructions and confirmations |
| Forgot password | Recovery steps, instructions and result messages |
| Headlines | Composer, media tools, post/comment editing, empty states and dialogs |
| MyKliq | Friends, invitations/joining, ranking, polls, mutual-friend counts and dialogs |
| Events | Forms, invitations, countdown labels, actions and statuses |
| Calendar | Forms, weekday/month display, controls and synchronization messages |
| Actions | Streaming, recording and viewing interface |
| Messages | Inbox labels, actions and empty states |
| Conversation | Recipient/retry state, composer, media actions and relative dates |
| Group chat | Participant/composer controls, missing-group state and relative dates |
| Own profile | Welcome/invite/share interface and profile editing |
| Member profile | Actions, headings, missing-profile state and date presentation |
| Themes | Shared theme editor, choices and result messages |
| Settings | Account/security, social connections, sports, borders/coins and privacy controls |
| Post view | Access/error states, controls and timestamps |
| Not found | Explanation and Home action |
| Meetup | Check-in controls and instructions; existing unrouted module remains unrouted |
| Contact us | Department descriptions and instructions |
| Community guidelines | Headings and full policy copy |
| Privacy policy | Headings and full policy copy |
| Terms of use | Headings and full policy copy |
| Disclaimer | Headings and full policy copy |
| Child safety | Headings and full policy copy |
| Advertiser requirements | Requirements, descriptions and actions |
| Advertiser onboarding | Form, confirmation and next steps |
| Ads manager | Controls, descriptions and management statuses |
| Admin | Access, account controls and dashboard wording |
| Admin reports | Moderation controls, statuses and dates |
| Maintenance dashboard | Access, controls, status labels and formatted metrics |
| Meme manager | Access, upload and library interface |
| Moviecon manager | Access, upload and library interface |

Shared coverage includes Profile Settings/Profile Details, polls, notifications,
media upload/retry/conversion, content pickers, music controls, call controls,
installation instructions, theme editing, tooltips, accessible labels,
confirmation dialogs and generic primitive controls. The existing centered
wrapping tabs and icon-only Headlines toolbar are retained.

## Notifications, validation and errors

App-owned in-app notification titles and known message templates are localized;
interpolated member names, event names and comment previews are preserved.
Direct/private message preview bodies are not translated.

Foreground browser notifications use the same interface messages. The PWA
worker receives a small notification-only dictionary for the selected language,
stored locally without account records or private message content. It uses this
dictionary for background alert wording. Existing badge acceptance, counts,
notification identifiers and navigation targets are unchanged.

Until a device has opened this release and supplied its language to the worker,
background alerts retain their original wording. Existing notifications already
displayed by the operating system are not rewritten.

Custom form and toast messages use catalog entries/templates. Unrecognized
validation text receives a localized field-check prompt; unrecognized destructive
error responses receive a localized retry prompt rather than raw server
diagnostics.

## Deliberate boundaries

- No new automatic translation of member-authored posts, messages, biographies,
  names, event titles, saved choices, invite codes or media is introduced.
- The pre-existing dictionary-based member-content translation remains separate;
  it is not comprehensive sentence translation.
- External event/news/sports content, advertisements' authored content, media
  titles and third-party OAuth pages retain their original content where the
  app does not own that wording.
- Text baked into images/videos, browser-native controls, operating-system
  permission prompts and third-party embedded players are outside app control.
- Static search/social metadata and the install manifest retain their existing
  branding; this is interface localization, not multilingual SEO routing.
- Policy translations are generated translations, not certified legal texts or
  a native-speaker review. Original English dates, obligations and policy
  structure were retained; qualified linguistic/legal review is still advised.
- No database migration, auth-flow redesign, paid translation service,
  production deployment or native-app migration was performed.

## User-run review checklist

After the frontend is synced to GitHub and the Amplify build is published:

1. Select each language from the public page and a signed-in page. Navigate,
   close/reopen the PWA, and confirm the selection is retained.
2. Switch language while a signup/profile/post form contains unsaved input;
   confirm the input remains and the surrounding interface changes.
3. Review each page in the table, including empty, loading, error, success and
   confirmation states that are relevant to your account.
4. Review longer German/French labels and Arabic on mobile. Confirm tabs wrap,
   dialogs stay in front of navigation, and menus/keyboard direction are usable.
5. Check calendar weekdays/months, message timestamps, counts of 0/1/2/many,
   poll percentages and mutual-friend counts.
6. Open the app once after updating before checking translated background push
   wording. Confirm private-message previews and badge behavior remain intact.
7. Compare policy pages with English and arrange fluent-language/legal review
   before relying on translated legal wording.

No claim of runtime or visual validation is made by this source report.
