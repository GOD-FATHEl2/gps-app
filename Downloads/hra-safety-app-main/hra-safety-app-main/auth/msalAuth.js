// msalauth.js (drop-in)
import { cca, scopes, roleMapping, defaultRole } from './msalConfig.js';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_SECRET';

// ==== REQUIRED ENV ====
const TENANT_ID = process.env.AZURE_TENANT_ID || process.env.TENANT_ID;
const CLIENT_ID = process.env.AZURE_CLIENT_ID || process.env.CLIENT_ID;
// Your API's App ID URI (as set under "Expose an API" in Azure App Registration)
const APP_AUDIENCE = 'api://eb9865fe-5d08-43ed-8ee9-6cad32b74981';

if (!TENANT_ID) throw new Error('TENANT_ID/AZURE_TENANT_ID is missing');
if (!CLIENT_ID) console.warn('⚠️ CLIENT_ID/AZURE_CLIENT_ID is missing (audience fallback still ok)');

const VALID_AUDIENCES = [APP_AUDIENCE, CLIENT_ID].filter(Boolean);
const VALID_ISSUERS  = [
  `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
  // Optionally accept legacy v1 issuer if needed:
  `https://sts.windows.net/${TENANT_ID}/`
];

const jwks = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 10 * 60 * 1000
});

async function getSigningKey(kid) {
  const key = await jwks.getSigningKey(kid);
  return key.getPublicKey();
}

// Validate Microsoft access token issued for YOUR API
export async function validateAccessToken(accessToken) {
  try {
    const decoded = jwt.decode(accessToken, { complete: true });
    if (!decoded?.header?.kid) throw new Error('Invalid token (no kid)');

    // Helpful diagnostics
    const p = decoded.payload || {};
    console.log('🔍 Incoming EXCHANGE token preview:', {
      aud: p.aud, scp: p.scp, roles: p.roles, iss: p.iss, tid: p.tid
    });

    // Sanity: must be our tenant
    if (p.tid && p.tid !== TENANT_ID) {
      throw new Error(`Wrong tenant: ${p.tid} (expected ${TENANT_ID})`);
    }

    const publicKey = await getSigningKey(decoded.header.kid);
    const payload = jwt.verify(accessToken, publicKey, {
      algorithms: ['RS256'],
      audience: VALID_AUDIENCES,
      issuer: VALID_ISSUERS
    });

    // Accept either scope "access" (delegated) OR app role (application permissions)
    const scopes = (payload.scp || '').split(' ').filter(Boolean);
    const roles  = payload.roles || [];

    const hasRequiredScope = scopes.includes('access');
    const hasAnyRole = Array.isArray(roles) && roles.length > 0;

    if (!hasRequiredScope && !hasAnyRole) {
      // If your design ALWAYS uses scope "access", keep only the scope check
      throw new Error('Missing permission: requires scope "access" (or app role)');
    }

    return payload;
  } catch (err) {
    // DO NOT reference variables that are out of scope here
    console.error('❌ validateAccessToken:', err.message);
    // Best-effort extra hint
    try {
      const d = jwt.decode(accessToken) || {};
      console.error('   Token had aud=', d.aud, 'iss=', d.iss, 'tid=', d.tid, 'scp=', d.scp);
      console.error('   Expected audiences:', VALID_AUDIENCES);
      console.error('   Accepted issuers:', VALID_ISSUERS);
    } catch {}
    throw new Error(`Invalid access token: ${err.message}`);
  }
}

// (unchanged) Exchange code, getUserInfo, getUserRoles, mapUserRole, createHRAToken, verifyToken, getAuthUrl...


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