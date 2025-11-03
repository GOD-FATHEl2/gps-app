# Azure Login Diagnostic Guide

## Issue Found and Fixed
**Missing MSAL Config Endpoint** - The frontend was trying to fetch `/api/auth/msal-config` but this endpoint didn't exist in server.js. This has now been added and pushed to GitHub.

## Critical Steps to Fix Azure Login

### 1. **Deploy the Latest Code to Azure**
Right-click on `hra-safety-app-main` folder → **Deploy to Azure**
- Make sure you select the correct App Service (`hra-sweden`)
- Wait for deployment to complete

### 2. **Verify Azure App Service Environment Variables**
Go to Azure Portal → App Service → Configuration → Application settings

**Required Variables:**
```
AZURE_CLIENT_ID=eb9865fe-5d08-43ed-8ee9-6cad32b74981
AZURE_TENANT_ID=81fa766e-a349-4867-8bf4-ab35e250a08f
AZURE_CLIENT_SECRET=<your-client-secret-value>
JWT_SECRET=<your-jwt-secret>
SESSION_SECRET=<your-session-secret>
NODE_ENV=production
PORT=8080
```

**CRITICAL:** Do NOT use `NODE_ENV=development` on Azure!

### 3. **Check Browser Console for Errors**
1. Open your Azure site: https://hra-sweden-dafdbdh4h4ghbxgm.swedencentral-01.azurewebsites.net
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Click "Logga in med Microsoft"
5. Look for error messages (red text)

**Common Errors and Fixes:**

#### Error: "Failed to get MSAL configuration"
- **Cause:** Environment variables missing in Azure
- **Fix:** Add all required variables in Azure Portal → Configuration

#### Error: "MSAL not initialized" or "msalInstance is null"
- **Cause:** Frontend can't reach `/api/auth/msal-config`
- **Fix:** Make sure latest code is deployed

#### Error: "AADSTS50011: The redirect URI... does not match"
- **Cause:** Redirect URI mismatch in Azure AD
- **Fix:** In Azure Portal → App Registrations → Authentication, add:
  - `https://hra-sweden-dafdbdh4h4ghbxgm.swedencentral-01.azurewebsites.net/auth/callback`

#### Error: "popup_window_error" or popup blocked
- **Cause:** Browser blocking popups
- **Fix:** Allow popups for your Azure site, or use password login instead

### 4. **Check Network Tab**
In browser Developer Tools:
1. Go to **Network** tab
2. Click "Logga in med Microsoft"
3. Look for these requests:

**Expected:**
- ✅ `GET /api/auth/msal-config` → Status 200
- ✅ `POST /api/auth/msal-exchange` → Status 200

**If you see:**
- ❌ `404 Not Found` → Code not deployed
- ❌ `500 Server Error` → Check Azure logs (see step 5)
- ❌ `503 Service Unavailable` → MSAL module failed to load

### 5. **Check Azure Application Logs**
In Azure Portal:
1. Go to App Service → **Monitoring** → **Log stream**
2. Look for startup messages:
   - ✅ "MSAL authentication module loaded successfully"
   - ❌ "MSAL authentication not available" → Missing dependencies or env vars

### 6. **Test the Config Endpoint Directly**
Open in browser:
```
https://hra-sweden-dafdbdh4h4ghbxgm.swedencentral-01.azurewebsites.net/api/auth/msal-config
```

**Expected Response:**
```json
{
  "clientId": "eb9865fe-5d08-43ed-8ee9-6cad32b74981",
  "tenantId": "81fa766e-a349-4867-8bf4-ab35e250a08f",
  "authority": "https://login.microsoftonline.com/81fa766e-a349-4867-8bf4-ab35e250a08f",
  "redirectUri": "https://hra-sweden-dafdbdh4h4ghbxgm.swedencentral-01.azurewebsites.net/auth/callback"
}
```

If you see `{"error": "..."}` or 404, the deployment failed.

## Quick Fix Checklist
- [ ] Deploy latest code to Azure
- [ ] Add all environment variables to Azure App Service
- [ ] Restart Azure App Service
- [ ] Clear browser cache and cookies
- [ ] Test `/api/auth/msal-config` endpoint
- [ ] Check browser console for errors
- [ ] Verify redirect URI in Azure AD

## Still Not Working?
1. Check browser console and copy any error messages
2. Check Azure Log Stream for server errors
3. Make sure you're using the correct Azure AD account (Volvo Cars account)
4. Try "Logga in med lösenord" as a backup (admin/admin123)

## Debug Commands
```powershell
# Test if the app is running
curl https://hra-sweden-dafdbdh4h4ghbxgm.swedencentral-01.azurewebsites.net/health

# Test MSAL config endpoint
curl https://hra-sweden-dafdbdh4h4ghbxgm.swedencentral-01.azurewebsites.net/api/auth/msal-config
```
