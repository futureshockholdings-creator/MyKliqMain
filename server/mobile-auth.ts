/**
 * Mobile Authentication Utilities
 * 
 * This module provides secure authentication helpers for the MyKliq mobile app.
 * 
 * **Architecture:**
 * - Mobile apps use JWT tokens for stateless authentication
 * - Web app uses Replit OAuth with session cookies
 * - Both share the same user database
 * 
 * **Security:**
 * - JWT tokens expire after 30 days
 * - Tokens should be stored in secure storage (iOS Keychain / Android Keystore)
 * - Never log tokens or include them in error messages
 * - PKCE (Proof Key for Code Exchange) helpers ready for OAuth flows
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// ============================================================================
// JWT TOKEN MANAGEMENT
// ============================================================================

/**
 * JWT token configuration
 * 
 * SECURITY: JWT_SECRET environment variable is REQUIRED
 * Application will fail to start if not provided
 */
const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'CRITICAL: JWT_SECRET environment variable is required and must be at least 32 characters. ' +
      'Generate a secure secret with: openssl rand -base64 32'
    );
  }
  return secret;
};

export const JWT_CONFIG = {
  get secret() { return getJWTSecret(); },
  expiresIn: '30d', // 30 days for mobile convenience
  algorithm: 'HS256' as const,
  issuer: 'mykliq-api',
  audience: 'mykliq-mobile',
};

/**
 * JWT payload structure
 */
export interface JWTPayload {
  userId: string;
  phoneNumber: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

/**
 * Generate a secure JWT token for mobile authentication
 * 
 * @param userId - User's unique identifier
 * @param phoneNumber - User's phone number
 * @returns Signed JWT token string
 * 
 * @example
 * const token = generateMobileToken('user-123', '+1234567890');
 */
export function generateMobileToken(userId: string, phoneNumber: string): string {
  const payload: JWTPayload = {
    userId,
    phoneNumber,
  };

  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.expiresIn,
    algorithm: JWT_CONFIG.algorithm,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
  });
}

/**
 * Verify and decode a JWT token
 * 
 * @param token - JWT token string
 * @returns Decoded payload if valid
 * @throws Error if token is invalid or expired
 * 
 * @example
 * try {
 *   const payload = verifyMobileToken('eyJhbGci...');
 *   console.log('User ID:', payload.userId);
 * } catch (error) {
 *   console.error('Invalid token');
 * }
 */
export function verifyMobileToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_CONFIG.secret, {
    algorithms: [JWT_CONFIG.algorithm],
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
  }) as JWTPayload;
}

/**
 * Express middleware to protect mobile API routes
 * 
 * Extracts and verifies JWT token from Authorization header.
 * Attaches userId to req for downstream handlers.
 * 
 * @example
 * app.get('/api/mobile/profile', verifyMobileTokenMiddleware, (req, res) => {
 *   const userId = (req as any).userId;
 *   // ... fetch user profile
 * });
 */
export const verifyMobileTokenMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        message: 'Unauthorized - Missing or invalid authorization header' 
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyMobileToken(token);

    // Attach userId to request for downstream handlers
    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        message: 'Token expired - Please log in again' 
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        message: 'Invalid token - Authentication failed' 
      });
    } else {
      res.status(500).json({ 
        message: 'Authentication error' 
      });
    }
  }
};

// ============================================================================
// PKCE HELPERS (OAuth 2.0)
// ============================================================================

/**
 * Generate a cryptographically random code verifier for PKCE
 * 
 * Used in OAuth 2.0 flows to prevent authorization code interception attacks.
 * Must be 43-128 characters from [A-Z a-z 0-9 - . _ ~]
 * 
 * @returns Base64URL-encoded random string (43 chars)
 * 
 * @see https://tools.ietf.org/html/rfc7636
 * 
 * @example
 * const verifier = generateCodeVerifier();
 * // Store securely for later use in token exchange
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate code challenge from code verifier for PKCE
 * 
 * Creates SHA-256 hash of the verifier, used in the authorization request.
 * 
 * @param verifier - Code verifier string
 * @returns Base64URL-encoded SHA-256 hash
 * 
 * @see https://tools.ietf.org/html/rfc7636
 * 
 * @example
 * const verifier = generateCodeVerifier();
 * const challenge = generateCodeChallenge(verifier);
 * // Send challenge in OAuth authorization request
 * // Send verifier in token exchange request
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

/**
 * Generate a secure random state parameter for OAuth
 * 
 * Used to prevent CSRF attacks in OAuth flows.
 * 
 * @returns Random hex string (32 chars)
 * 
 * @example
 * const state = generateOAuthState();
 * // Store in session/database
 * // Verify matches on OAuth callback
 */
export function generateOAuthState(): string {
  return crypto.randomBytes(16).toString('hex');
}

// ============================================================================
// PASSWORD UTILITIES
// ============================================================================

/**
 * Generate a secure random password reset token
 * 
 * @returns Random hex string (64 chars)
 * 
 * @example
 * const resetToken = generatePasswordResetToken();
 * // Store hash of token in database
 * // Send token to user via SMS
 */
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a password reset token for database storage
 * 
 * Never store plain tokens - always hash before saving
 * 
 * @param token - Plain reset token
 * @returns SHA-256 hash of token
 * 
 * @example
 * const token = generatePasswordResetToken();
 * const hashedToken = hashResetToken(token);
 * // Save hashedToken to database
 * // Send plain token to user
 */
export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ============================================================================
// SECURITY BEST PRACTICES
// ============================================================================

/**
 * Mobile Client Security Checklist:
 * 
 * 1. TOKEN STORAGE:
 *    ✓ Use expo-secure-store (Expo) or react-native-keychain (bare RN)
 *    ✓ NEVER use AsyncStorage for tokens (unencrypted)
 *    ✓ Clear tokens on logout
 * 
 * 2. NETWORK SECURITY:
 *    ✓ Always use HTTPS for API calls
 *    ✓ Validate SSL certificates
 *    ✓ Consider SSL pinning for high-security apps
 * 
 * 3. TOKEN HANDLING:
 *    ✓ Include token in Authorization header (not query params)
 *    ✓ Handle token expiry gracefully (prompt re-login)
 *    ✓ Never log tokens (even in development)
 * 
 * 4. OAUTH FLOWS (Phase 2):
 *    ✓ Always use PKCE for mobile OAuth
 *    ✓ Use system browser (not WebViews)
 *    ✓ Implement deep linking for callbacks
 *    ✓ Validate state parameter to prevent CSRF
 * 
 * 5. CODE SECURITY:
 *    ✓ Never hardcode API keys or secrets
 *    ✓ Use environment variables for endpoints
 *    ✓ Obfuscate code for production builds
 */

export const SECURITY_DOCUMENTATION = `
MyKliq Mobile Authentication Architecture
==========================================

CURRENT IMPLEMENTATION (Phase 0)
---------------------------------
- Authentication Method: JWT tokens with phone/password
- Token Lifespan: 30 days
- Storage: Client-side secure storage (Keychain/Keystore)
- Validation: Server-side JWT verification on every request

AUTHENTICATION FLOW
-------------------
1. User enters phone + password
2. Server validates credentials against database
3. Server generates JWT token with userId + phoneNumber
4. Mobile app stores token in secure storage (expo-secure-store)
5. Every API request includes: Authorization: Bearer <token>
6. Server verifies token and extracts userId

FUTURE OAUTH SUPPORT (Phase 2)
-------------------------------
When implementing social platform OAuth:
1. Use PKCE (already implemented: generateCodeVerifier/Challenge)
2. Open system browser for OAuth authorization
3. Deep link callback to app (myapp://oauth/callback)
4. Exchange authorization code for tokens server-side
5. Store access/refresh tokens in secure storage

SECURITY RECOMMENDATIONS
------------------------
- Rotate JWT_SECRET in production
- Implement token refresh mechanism for longer sessions
- Add rate limiting to login endpoints
- Monitor for suspicious login patterns
- Consider adding device fingerprinting
`;
