---
name: Member social connections
description: Rules for member-owned YouTube, Twitch, Discord, Reddit, Pinterest, and Bluesky connections.
---

Each social connection belongs to exactly one authenticated MyKliq member and one platform. Reconnecting updates that member's connection rather than creating another. Workspace-level integrations are developer tooling only and must not appear in a normal member's social feed.

**Why:** A shared developer connection could expose one account's imported content to unrelated members. OAuth callbacks also cannot safely rely on browser sessions when the frontend and API use different domains.

**How to apply:** Bind authorization state to the member server-side, consume it once, and return to the app URL saved at authorization time. Use member-owned encrypted credentials for OAuth providers and member-owned app passwords for Bluesky. Mobile provider authorization must use the same registered HTTPS API callbacks as web; after the server exchanges and stores tokens, it returns the result to the fixed `mykliq://oauth/callback` deep link.

Discord message imports are the one bot-mediated exception to provider user APIs. A message is eligible only when all three permissions are active: the server has installed the bot, a server manager has enabled that exact public server channel, and the linked MyKliq member has opted in for that server. Direct messages are never eligible.

**Why:** Discord user OAuth cannot read message history, while a bot could otherwise expose messages from members or channels that never consented.

**How to apply:** Keep bot installation, channel permission, and member permission independently revocable and audited. Resolve every imported message back to that member's own Discord social credential so existing Kliq ownership and feed visibility rules remain authoritative.

The YouTube and Twitch client IDs and secrets are already injected into the running workspace under the expected environment-variable names, even though the environment inventory API may report those legacy entries as absent.

**Why:** Relying only on the inventory API produced an incorrect request to recreate provider applications that were already configured.

**How to apply:** When validating these four provider credentials, check only whether the runtime variables are present and non-empty; never print their values or ask the user to recreate the provider setup unless an actual OAuth response shows the credentials are invalid.