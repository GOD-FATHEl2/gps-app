# CRITICAL FIX: HTTP vs HTTPS Redirect URI Issue

## Problem Detected
Your Azure deployment was returning:
```json
{
  "redirectUri": "http://hra-sweden-dafdbdh4h4ghbxgm.swedencentral-01.azurewebsites.net"
}
```

**This is wrong!** It should be `https://` not `http://`

## Why This Happens
Azure App Service runs behind a load balancer/proxy. When your Node.js app checks `req.protocol`, it sees `http` because the internal communication between the load balancer and your app uses HTTP. But the external connection is HTTPS.

## The Fix ✅
Updated `server.js` to:
1. Check the `x-forwarded-proto` header (set by Azure's load balancer)
2. Force HTTPS for any `*.azurewebsites.net` domain
3. Apply this to both `/api/auth/msal-config` and `/auth/callback` endpoints

## Changes Made
- **Commit:** `12793b4`
- **File:** `server.js`
- **Lines:** MSAL config and callback handlers

## Code Change
```javascript
// Before (wrong):
const protocol = req.protocol || 'https';
const redirectUri = `${protocol}://${host}/auth/callback`;
// Result: http://... ❌

// After (correct):
const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
const useHttps = protocol === 'https' || host.includes('azurewebsites.net');
const redirectUri = `${useHttps ? 'https' : protocol}://${host}/auth/callback`;
// Result: https://... ✅
```

## What You Need To Do

### 1. Deploy to Azure (REQUIRED)
Right-click project folder → Deploy to Azure

### 2. Test the Config Endpoint
Open: https://hra-sweden-dafdbdh4h4ghbxgm.swedencentral-01.azurewebsites.net/api/auth/msal-config

**Expected (correct):**
```json
{
  "clientId": "eb9865fe-5d08-43ed-8ee9-6cad32b74981",
  "tenantId": "81fa766e-a349-4867-8bf4-ab35e250a08f",
  "authority": "https://login.microsoftonline.com/81fa766e-a349-4867-8bf4-ab35e250a08f",
  "redirectUri": "https://hra-sweden-dafdbdh4h4ghbxgm.swedencentral-01.azurewebsites.net/auth/callback"
}
```

### 3. Verify Azure AD Redirect URI
Go to Azure Portal → App Registrations → Your App → Authentication

Make sure this redirect URI is registered:
```
https://hra-sweden-dafdbdh4h4ghbxgm.swedencentral-01.azurewebsites.net/auth/callback
```

**NOT:**
```
http://hra-sweden-dafdbdh4h4ghbxgm.swedencentral-01.azurewebsites.net/auth/callback
```

## Why This Matters
- ❌ HTTP redirect URI → Azure AD rejects the authentication (AADSTS50011 error)
- ✅ HTTPS redirect URI → Authentication works correctly

## Testing After Deployment
1. Open your Azure site
2. Click "Logga in med Microsoft"
3. Microsoft login popup should open
4. After login, should redirect back successfully
5. No AADSTS50011 errors

## Status
- ✅ Code fixed and pushed to GitHub
- ⏳ Needs deployment to Azure
- ⏳ Test after deployment

## Related Issues Fixed
- Missing `/api/auth/msal-config` endpoint (previous commit)
- HTTP vs HTTPS protocol detection (this commit)

Both fixes are essential for Microsoft login to work on Azure!
