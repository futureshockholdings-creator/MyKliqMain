import assert from "node:assert/strict";
import crypto from "node:crypto";
import { pool } from "../server/db";
import { storage } from "../server/storage";
import { encryptForStorage, decryptFromStorage } from "../server/cryptoService";
import { createSocialOAuthState, consumeSocialOAuthState } from "../server/socialOAuthStateService";
import { oauthService, type OAuthPlatform } from "../server/oauthService";
import { disconnectPlatform as disconnectMobilePlatform } from "../server/oauth-mobile";

const platforms = ["youtube", "discord", "reddit", "pinterest", "bluesky"];
const runId = `social-isolation-${crypto.randomUUID()}`;
const ownerA = `${runId}-owner-a`;
const ownerB = `${runId}-owner-b`;
const viewerA = `${runId}-viewer-a`;
const viewerB = `${runId}-viewer-b`;
const outsider = `${runId}-outsider`;
const users = [ownerA, ownerB, viewerA, viewerB, outsider];

async function main() {
  const client = await pool.connect();
  const originalYouTube = oauthService.getPlatform("youtube");
  try {
    for (const [index, userId] of users.entries()) {
      await client.query(
        `INSERT INTO users (id, first_name, last_name, invite_code)
         VALUES ($1, $2, 'Isolation Test', $3)`,
        [userId, `Member ${index + 1}`, `${runId.slice(-12)}-${index}`],
      );
    }

    // The viewers belong to disjoint Kliqs. The outsider has no links.
    await client.query(
      `INSERT INTO friendships (user_id, friend_id, rank, status)
       VALUES ($1, $2, 1, 'accepted'), ($3, $4, 1, 'accepted')`,
      [viewerA, ownerA, viewerB, ownerB],
    );

    const credentialIds = new Map<string, string>();
    for (const platform of platforms) {
      for (const [owner, suffix] of [[ownerA, "a"], [ownerB, "b"]] as const) {
        const accessToken = `${runId}-${platform}-${suffix}-access`;
        const refreshToken = `${runId}-${platform}-${suffix}-refresh`;
        const result = await client.query<{ id: string; encrypted_access_token: string; encrypted_refresh_token: string }>(
          `INSERT INTO social_credentials
             (user_id, platform, platform_user_id, platform_username,
              encrypted_access_token, encrypted_refresh_token, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, true)
           RETURNING id, encrypted_access_token, encrypted_refresh_token`,
          [
            owner,
            platform,
            `${platform}-provider-${suffix}`,
            `${platform}_account_${suffix}`,
            encryptForStorage(accessToken),
            encryptForStorage(refreshToken),
          ],
        );
        const credential = result.rows[0];
        credentialIds.set(`${owner}:${platform}`, credential.id);
        assert.notEqual(credential.encrypted_access_token, accessToken);
        assert.notEqual(credential.encrypted_refresh_token, refreshToken);
        assert.equal(decryptFromStorage(credential.encrypted_access_token), accessToken);

        await client.query(
          `INSERT INTO external_posts
             (social_credential_id, platform, platform_post_id, platform_user_id,
              platform_username, content, post_url, platform_created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            credential.id,
            platform,
            `${runId}-${platform}-${suffix}-post`,
            `${platform}-provider-${suffix}`,
            `${platform}_account_${suffix}`,
            `isolation marker ${platform} ${suffix}`,
            `https://example.invalid/${platform}/${suffix}`,
          ],
        );
      }
    }

    const [ownerAPosts, ownerBPosts, outsiderPosts, viewerAFeed, viewerBFeed, outsiderFeed] = await Promise.all([
      storage.getExternalPosts(ownerA),
      storage.getExternalPosts(ownerB),
      storage.getExternalPosts(outsider),
      storage.getKliqFeed(viewerA, [], 1, 100, false),
      storage.getKliqFeed(viewerB, [], 1, 100, false),
      storage.getKliqFeed(outsider, [], 1, 100, false),
    ]);

    assert.equal(ownerAPosts.length, platforms.length);
    assert.equal(ownerBPosts.length, platforms.length);
    assert.equal(outsiderPosts.length, 0);
    assert(ownerAPosts.every(post => post.socialCredential.userId === ownerA));
    assert(ownerBPosts.every(post => post.socialCredential.userId === ownerB));

    const viewerAExternal = viewerAFeed.items.filter(item => item.type === "external_post");
    const viewerBExternal = viewerBFeed.items.filter(item => item.type === "external_post");
    const outsiderExternal = outsiderFeed.items.filter(item => item.type === "external_post");
    assert.equal(viewerAExternal.length, platforms.length);
    assert(viewerAExternal.every(item => item.userId === ownerA));
    assert.equal(viewerBExternal.length, platforms.length);
    assert(viewerBExternal.every(item => item.userId === ownerB));
    assert.equal(outsiderExternal.length, 0);

    // Exercise the real web reconnect service. It resolves the row by member
    // identity and provider rather than accepting a credential ID.
    const ownerACredential = credentialIds.get(`${ownerA}:youtube`)!;
    const ownerBCredential = credentialIds.get(`${ownerB}:youtube`)!;
    const replacementToken = `${runId}-youtube-a-reconnected`;
    const fakeYouTube: OAuthPlatform = {
      getAuthUrl: () => "https://example.invalid/authorize",
      exchangeCodeForTokens: async code => ({
        accessToken: code === "owner-a-reconnect" ? replacementToken : `${runId}-unexpected-token`,
        refreshToken: `${runId}-youtube-a-new-refresh`,
        expiresIn: 3600,
      }),
      refreshTokens: async refreshToken => ({ accessToken: `${refreshToken}-refreshed` }),
      getUserInfo: async () => ({ id: "youtube-provider-a-reconnected", username: "youtube_account_a_reconnected" }),
      fetchUserPosts: async () => [],
      revokeTokens: async () => undefined,
    };
    (oauthService as any).platforms.set("youtube", fakeYouTube);
    assert.deepEqual(
      await oauthService.handleOAuthCallback("youtube", "owner-a-reconnect", ownerA),
      { success: true, userId: ownerA },
    );
    const [reconnectedA, unchangedB] = await Promise.all([
      storage.getSocialCredential(ownerA, "youtube"),
      storage.getSocialCredential(ownerB, "youtube"),
    ]);
    assert.equal(reconnectedA?.id, ownerACredential);
    assert.equal(decryptFromStorage(reconnectedA!.encryptedAccessToken), replacementToken);
    assert.equal(unchangedB?.id, ownerBCredential);
    assert.equal(unchangedB?.platformUsername, "youtube_account_b");

    // Exercise the real revocation service with a member identity and provider.
    assert.equal(await oauthService.disconnectPlatform(ownerA, "youtube"), true);
    assert.equal((await storage.getSocialCredential(ownerA, "youtube"))?.isActive, false);
    assert.equal((await storage.getSocialCredential(ownerB, "youtube"))?.isActive, true);

    // Exercise the authenticated mobile disconnect handler under owner A's
    // identity. It must not delete owner B's credential for the same provider.
    let mobileStatus = 200;
    let mobileBody: any;
    const mobileResponse = {
      status(code: number) {
        mobileStatus = code;
        return this;
      },
      json(body: any) {
        mobileBody = body;
        return this;
      },
    };
    await disconnectMobilePlatform(
      { params: { platform: "youtube" }, userId: ownerA } as any,
      mobileResponse as any,
    );
    assert.equal(mobileStatus, 200);
    assert.equal(mobileBody?.success, true);
    assert.equal(await storage.getSocialCredential(ownerA, "youtube"), undefined);
    assert.equal((await storage.getSocialCredential(ownerB, "youtube"))?.id, ownerBCredential);

    const [viewerAAfterDisconnect, viewerBAfterDisconnect] = await Promise.all([
      storage.getKliqFeed(viewerA, [], 1, 100, false),
      storage.getKliqFeed(viewerB, [], 1, 100, false),
    ]);
    const viewerAAfterExternal = viewerAAfterDisconnect.items.filter(item => item.type === "external_post");
    const viewerBAfterExternal = viewerBAfterDisconnect.items.filter(item => item.type === "external_post");
    assert.equal(viewerAAfterExternal.length, platforms.length - 1);
    assert(viewerAAfterExternal.every(item => item.userId === ownerA));
    assert.equal(viewerBAfterExternal.length, platforms.length);
    assert(viewerBAfterExternal.every(item => item.userId === ownerB));

    // OAuth state survives process-local client state, is member-bound, platform-bound,
    // encrypted at rest, and can be consumed exactly once.
    const verifier = `${runId}-pkce-verifier`;
    const state = await createSocialOAuthState({
      userId: ownerA,
      platform: "youtube",
      returnUrl: "mykliq://oauth/callback",
      redirectUri: "https://example.invalid/api/oauth/callback/youtube",
      codeVerifier: verifier,
    });
    assert.equal(await consumeSocialOAuthState(state, "discord"), null);
    const consumed = await consumeSocialOAuthState(state, "youtube");
    assert.equal(consumed?.userId, ownerA);
    assert.equal(consumed?.codeVerifier, verifier);
    assert.equal(await consumeSocialOAuthState(state, "youtube"), null);

    console.log(`Social isolation validation passed for ${platforms.length} providers across disjoint Kliqs and web/mobile account paths.`);
  } finally {
    if (originalYouTube) {
      (oauthService as any).platforms.set("youtube", originalYouTube);
    }
    await client.query(`DELETE FROM users WHERE id = ANY($1::varchar[])`, [users]);
    client.release();
    await pool.end();
  }
}

main().then(
  () => process.exit(0),
  error => {
    console.error("Social isolation validation failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  },
);