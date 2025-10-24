import { cca, scopes, roleMapping, defaultRole } from './msalConfig.js';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { promisify } from 'util';

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_SECRET";

// JWKS client for token validation (like your FastAPI implementation)
const jwksClientInstance = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/discovery/v2.0/keys`,
  requestHeaders: {}, // Default headers
  timeout: 30000, // Defaults to 30s
  cache: true,
  cacheMaxEntries: 5, // Default value
  cacheMaxAge: 600000, // 10 minutes like your FastAPI cache
});

const getKey = promisify(jwksClientInstance.getSigningKey.bind(jwksClientInstance));

// Validate Microsoft access token (enhanced following implementation guide)
export async function validateAccessToken(accessToken) {
  try {
    // 🔍 TEMPORARY: Log incoming token claims for debugging
    try {
      const decoded = jwt.decode(accessToken, { complete: true });
      console.log('🔍 Incoming token claims:');
      console.log('   Header kid=', decoded?.header?.kid);
      console.log('   Claims preview:', {
        aud: decoded?.payload?.aud,
        iss: decoded?.payload?.iss,
        tid: decoded?.payload?.tid,
        scp: decoded?.payload?.scp,
        roles: decoded?.payload?.roles
      });
    } catch (logError) {
      console.log('⚠️ Could not decode token for logging:', logError.message);
    }
    
    // Decode token header to get kid
    const decodedToken = jwt.decode(accessToken, { complete: true });
    
    if (!decodedToken || !decodedToken.header || !decodedToken.header.kid) {
      throw new Error('Invalid token structure');
    }
    
    // Get signing key from JWKS
    const key = await getKey(decodedToken.header.kid);
    const signingKey = key.getPublicKey();
    
    // Define valid audiences and issuers
    const clientId = process.env.AZURE_CLIENT_ID || process.env.CLIENT_ID;
    const validAudiences = [
      clientId,
      "api://eb9865fe-5d08-43ed-8ee9-6cad32b74981"  // App ID URI required
    ].filter(Boolean);
    
    console.log('🔍 Expected audiences:', validAudiences);
    
    const validIssuers = [
      `https://sts.windows.net/${process.env.AZURE_TENANT_ID}/`,
      `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0`,
      `https://login.microsoftonline.com/${process.env.TENANT_ID}/`,
      `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0`
    ].filter(Boolean);
    
    // Verify token with proper validation
    const payload = jwt.verify(accessToken, signingKey, {
      audience: validAudiences,
      issuer: validIssuers,
      algorithms: ['RS256'],
      ignoreExpiration: false,
      ignoreNotBefore: false
    });
    
    console.log('✅ Token validation successful for user:', payload.name || payload.preferred_username);
    console.log('   Token audience:', payload.aud);
    return payload;
  } catch (error) {
    console.error('❌ Token validation failed:', error.message);
    if (error.message.includes('audience')) {
      const decoded = jwt.decode(accessToken);
      console.error('   Token audience was:', decoded?.aud);
      console.error('   Expected audiences:', validAudiences);
    }
    throw new Error(`Invalid access token: ${error.message}`);
  }
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code, redirectUri) {
    try {
        const tokenRequest = {
            code: code,
            scopes: scopes.graph,
            redirectUri: redirectUri,
        };

        const response = await cca.acquireTokenByCode(tokenRequest);
        return response;
    } catch (error) {
        console.error('Error exchanging code for tokens:', error);
        throw error;
    }
}

// Get user info from Microsoft Graph or token claims
export async function getUserInfo(accessToken) {
  try {
    // First validate the token (like your FastAPI implementation)
    const tokenClaims = await validateAccessToken(accessToken);
    
    // Try to get detailed info from Graph API
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return await response.json();
    } else {
      // Fallback to token claims if Graph API fails
      console.log('Graph API failed, using token claims');
      return {
        id: tokenClaims.oid || tokenClaims.sub,
        displayName: tokenClaims.name || tokenClaims.preferred_username,
        userPrincipalName: tokenClaims.upn || tokenClaims.preferred_username,
        mail: tokenClaims.email,
        givenName: tokenClaims.given_name,
        surname: tokenClaims.family_name
      };
    }
  } catch (error) {
    console.error('Error getting user info:', error);
    throw error;
  }
}// Get user app roles from validated access token
export async function getUserRoles(accessToken) {
  try {
    // Validate token first (like your FastAPI implementation)
    const tokenClaims = await validateAccessToken(accessToken);
    
    // Extract roles from token claims
    const roles = tokenClaims.roles || [];
    const groups = tokenClaims.groups || [];
    
    console.log('Token roles:', roles);
    console.log('Token groups:', groups);
    
    return roles;
  } catch (error) {
    console.error('Error getting user roles from token:', error);
    return [];
  }
}// Legacy function for backward compatibility
export async function getUserGroups(accessToken) {
    // For app roles, we get them from token claims instead of Graph API
    return getUserRoles(accessToken);
}

// Map Azure AD app roles to HRA roles
export function mapUserRole(roles) {
    // roles is now an array of strings like ['admin', 'supervisor', etc.]
    for (const role of roles) {
        // Direct mapping since app role values match our HRA roles
        if (['admin', 'superintendent', 'arbetsledare', 'supervisor', 'underhall'].includes(role)) {
            return role;
        }
        // Also check legacy role mapping if defined
        if (roleMapping[role]) {
            return roleMapping[role];
        }
    }
    return defaultRole;
}

// Create JWT token for HRA system
export function createHRAToken(user, role) {
    const payload = {
        uid: user.id,
        email: user.mail || user.userPrincipalName,
        name: user.displayName,
        role: role,
        azureId: user.id,
        upn: user.userPrincipalName
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

// Verify JWT token middleware
export function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Ingen token tillhandahållen' });
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Ogiltig token' });
    }
}

// Get auth URL for MSAL login with app roles support
export function getAuthUrl(redirectUri) {
    const authUrlParameters = {
        scopes: scopes.graph,
        redirectUri: redirectUri,
        // Request app roles to be included in the token
        extraQueryParameters: {
            'response_type': 'code',
            'response_mode': 'query',
            // This ensures app roles are included in the token
            'scope': 'openid profile email User.Read'
        }
    };

    return cca.getAuthCodeUrl(authUrlParameters);
}