# Root Cause Analysis: Azure Login Not Working

## Problem Identified ✅

**The Microsoft login button does nothing on Azure because:**

### 1. **Missing MSAL Config Endpoint** (FIXED ✅)
- **Issue:** Frontend code tries to fetch `/api/auth/msal-config` to initialize MSAL
- **Problem:** This endpoint didn't exist in `server.js`
- **Impact:** MSAL instance never initializes, so clicking "Logga in med Microsoft" does nothing
- **Fix Applied:** Added the missing endpoint in commit `4c0034d`

### 2. **Likely Missing Environment Variables on Azure** (NEEDS CHECK ⚠️)
- **Issue:** Azure App Service doesn't automatically read `.env` files
- **Problem:** If `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET` are not set in Azure Portal, the MSAL config endpoint will return empty/undefined values
- **Impact:** Frontend gets invalid MSAL config, initialization fails silently

### 3. **Possible Old Deployment** (NEEDS REDEPLOYMENT 🔄)
- **Issue:** Azure might be running an old version of the code
- **Problem:** Even with the fix, if not redeployed, the endpoint won't exist
- **Fix Required:** Deploy latest code to Azure

## Why It Works Locally But Not on Azure

| Aspect | Local | Azure |
|--------|-------|-------|
| Environment Variables | Reads from `.env` file ✅ | **Needs Configuration settings** ⚠️ |
| Code Version | Latest from disk ✅ | **May be outdated** ⚠️ |
| MSAL Config Endpoint | Now exists (after fix) ✅ | **Won't exist until redeployment** ⚠️ |
| Debugging | Easy to see console logs ✅ | Requires Log Stream 🔍 |

## Immediate Actions Required

### Step 1: Deploy Latest Code to Azure 🚀
**Right-click on project folder → Deploy to Azure**

This will deploy the fix that adds the `/api/auth/msal-config` endpoint.

### Step 2: Configure Environment Variables in Azure ⚙️

Go to: **Azure Portal → App Service → Configuration → Application settings**

Add these if missing:
```
AZURE_CLIENT_ID = eb9865fe-5d08-43ed-8ee9-6cad32b74981
AZURE_TENANT_ID = 81fa766e-a349-4867-8bf4-ab35e250a08f
AZURE_CLIENT_SECRET = <get from Azure AD App Registration>
JWT_SECRET = <copy from your .env>
SESSION_SECRET = <copy from your .env>
NODE_ENV = production
```

**Save and Restart the App Service**

### Step 3: Verify the Fix 🔍

1. Open: https://hra-sweden-dafdbdh4h4ghbxgm.swedencentral-01.azurewebsites.net/api/auth/msal-config

   **Expected:**
   ```json
   {
     "clientId": "eb9865fe-5d08-43ed-8ee9-6cad32b74981",
     "tenantId": "81fa766e-a349-4867-8bf4-ab35e250a08f",
     "authority": "https://login.microsoftonline.com/81fa766e-a349-4867-8bf4-ab35e250a08f",
     "redirectUri": "https://hra-sweden-dafdbdh4h4ghbxgm.swedencentral-01.azurewebsites.net/auth/callback"
   }
   ```

2. Open the main site and press F12 (Developer Tools)
3. Click "Logga in med Microsoft"
4. Check Console tab for:
   - ✅ "📋 MSAL Config (final): ..."
   - ✅ "🔧 MSALAuthService initialized with MSAL instance"
   - ✅ Microsoft popup should open

## Technical Details

### What the Fix Does
Added a new endpoint in `server.js`:
```javascript
app.get("/api/auth/msal-config", (req, res) => {
  const config = {
    clientId: process.env.AZURE_CLIENT_ID || process.env.CLIENT_ID,
    tenantId: process.env.AZURE_TENANT_ID || process.env.TENANT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || process.env.TENANT_ID}`,
    redirectUri: `${req.protocol}://${req.get('host')}/auth/callback`
  };
  res.json(config);
});
```

### Why This Was Missing
The MSAL implementation was assuming the frontend would use hardcoded config, but the actual frontend code (in `app.js` lines 447-476) tries to fetch config from the backend first, with fallback to hardcoded values. Without this endpoint:
1. Frontend fetch fails
2. Falls back to hardcoded config
3. But the hardcoded config had some issues with URL construction
4. MSAL instance never properly initializes
5. Button click does nothing

## Success Indicators

After deploying and configuring:
- ✅ `/api/auth/msal-config` returns valid JSON
- ✅ Browser console shows MSAL initialization messages
- ✅ Clicking "Logga in med Microsoft" opens popup
- ✅ After login, redirects back to app with user logged in

## Backup Plan

If Microsoft login still doesn't work after these fixes:
1. Use "Logga in med lösenord" option
2. Default credentials: `admin` / `admin123`
3. This bypass always works regardless of MSAL configuration

## Files Changed
- `server.js` - Added `/api/auth/msal-config` endpoint
- Committed and pushed to GitHub (commit: 4c0034d)

## Next Steps
1. Deploy to Azure
2. Add environment variables
3. Test the login
4. If issues persist, check AZURE_LOGIN_DIAGNOSTIC.md for detailed troubleshooting
