# OAuth Deployment Guide

Production deployment configuration for MyKliq mobile OAuth authentication.

## Environment Variables

### Required for All Deployments

```bash
# JWT Authentication (Mobile)
JWT_SECRET=<generated-secret-32-chars-minimum>  # openssl rand -base64 32

# Mobile OAuth Redirect
MOBILE_OAUTH_REDIRECT_URI=https://yourdomain.com/oauth/callback  # Or myapp://oauth/callback
```

### Required for Replit OAuth

```bash
# Replit OAuth (Web & Mobile)
ISSUER_URL=https://replit.com/oidc
REPL_ID=<your-replit-app-id>
REPLIT_DOMAINS=yourdomain.com,localhost:5000  # Comma-separated
```

### Required for Social Platforms (Phase 2)

```bash
# TikTok OAuth
TIKTOK_CLIENT_ID=<your-tiktok-client-id>
TIKTOK_CLIENT_SECRET=<your-tiktok-client-secret>

# YouTube OAuth
YOUTUBE_CLIENT_ID=<your-youtube-client-id>
YOUTUBE_CLIENT_SECRET=<your-youtube-client-secret>

# Discord OAuth
DISCORD_CLIENT_ID=<your-discord-client-id>
DISCORD_CLIENT_SECRET=<your-discord-client-secret>

# Add more platforms as needed...
```

## Redirect URI Configuration

### Development
```
Custom Scheme: myapp://oauth/callback
```

### Production
```
Universal Link (iOS): https://yourdomain.com/oauth/callback
App Link (Android): https://yourdomain.com/oauth/callback
```

## OAuth State Management

### Current Implementation (MVP)
- **Storage**: In-memory Map with 5-minute TTL
- **Cleanup**: Auto-cleanup every 60 seconds
- **Limitation**: Single-server deployments only

### Production Migration (Multi-Instance)
When horizontally scaling to multiple servers:

1. **Install Redis:**
   ```bash
   npm install redis @types/redis
   ```

2. **Replace in-memory store:**
   ```typescript
   // server/oauth-mobile.ts
   import { createClient } from 'redis';
   
   const redis = createClient({ url: process.env.REDIS_URL });
   await redis.connect();
   
   // Store state
   await redis.setEx(`oauth:${state}`, 300, JSON.stringify(oauthData));
   
   // Consume state
   const data = await redis.get(`oauth:${state}`);
   await redis.del(`oauth:${state}`);
   ```

3. **Environment variable:**
   ```bash
   REDIS_URL=redis://localhost:6379
   ```

## Security Checklist

### Before Production

- [ ] JWT_SECRET is >= 32 characters
- [ ] JWT_SECRET is different from development
- [ ] MOBILE_OAUTH_REDIRECT_URI uses HTTPS (not http://)
- [ ] Redirect URI registered with all OAuth providers
- [ ] Client secrets stored as environment variables (never in code)
- [ ] OAuth endpoints use rate limiting
- [ ] CORS configured for mobile domains only
- [ ] SSL/TLS certificates valid and not self-signed

### OAuth Provider Registration

For each platform (Replit, TikTok, YouTube, etc.):

1. Register your app at provider's developer portal
2. Configure redirect URI: `https://yourdomain.com/oauth/callback`
3. Copy Client ID and Client Secret to environment variables
4. Test OAuth flow in staging environment
5. Monitor token refresh rates and adjust TTLs

## Multi-Environment Setup

### Development
```bash
# .env.development
MOBILE_OAUTH_REDIRECT_URI=myapp://oauth/callback
ISSUER_URL=https://replit.com/oidc
```

### Staging
```bash
# .env.staging
MOBILE_OAUTH_REDIRECT_URI=https://staging.yourdomain.com/oauth/callback
ISSUER_URL=https://replit.com/oidc
```

### Production
```bash
# .env.production
MOBILE_OAUTH_REDIRECT_URI=https://yourdomain.com/oauth/callback
ISSUER_URL=https://replit.com/oidc
```

## Monitoring & Logging

### Key Metrics
- OAuth initiation rate
- Callback success rate
- State verification failures (potential attacks)
- Token exchange errors
- Average flow completion time

### Log Events
```javascript
// Successful OAuth
console.log(`OAuth success: ${platform} for user ${userId}`);

// Failed state verification
console.warn(`OAuth state mismatch: ${state} (CSRF attempt?)`);

// Token exchange failure
console.error(`Token exchange failed for ${platform}: ${error}`);
```

## Troubleshooting

### "OAuth not configured" Error
**Cause**: Missing ISSUER_URL or REPL_ID
**Fix**: Set environment variables

### "Invalid OAuth state" Error
**Cause**: State expired (>5 min) or server restart cleared memory
**Fix**: Migrate to Redis for persistent state storage

### Redirect URI Mismatch
**Cause**: Provider-registered URI doesn't match request
**Fix**: Update redirect URI in provider settings or environment variable

### Token Exchange Fails
**Cause**: Invalid client credentials or network issue
**Fix**: Verify CLIENT_ID and CLIENT_SECRET are correct

## Rollback Plan

If OAuth issues occur in production:

1. **Disable OAuth Login**: Comment out OAuth routes in `server/routes.ts`
2. **Fallback to Phone/Password**: Existing login still works
3. **Fix Configuration**: Update environment variables
4. **Re-enable OAuth**: Uncomment routes, restart servers
5. **Test**: Verify OAuth flow works before announcing

## Support

For issues not covered here, see:
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [OIDC Specification](https://openid.net/specs/openid-connect-core-1_0.html)
