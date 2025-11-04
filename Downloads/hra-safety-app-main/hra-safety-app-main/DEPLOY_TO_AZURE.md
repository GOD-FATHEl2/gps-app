# Deploy to Azure - Manual Steps

GitHub Actions is configured for a different Azure app name. Follow these steps to deploy manually:

## Option 1: Deploy from VS Code (Recommended - Easiest)

1. **Install Azure App Service Extension** (if not installed):
   - Press `Ctrl+Shift+X`
   - Search for "Azure App Service"
   - Install the extension

2. **Deploy:**
   - Right-click on the `hra-safety-app-main` folder in VS Code Explorer
   - Select **"Deploy to Web App..."**
   - Sign in to Azure if prompted
   - Select subscription: **Volvo Cars**
   - Select **"hra-sweden"** from the list
   - Confirm deployment
   - Wait 2-3 minutes

3. **Verify:**
   - Visit: https://hra-sweden-dafdbdh4h4ghbxgm.swedencentral-01.azurewebsites.net/api/auth/msal-config
   - Should show HTTPS redirectUri

---

## Option 2: Deploy using Azure CLI

```powershell
# Login to Azure
az login

# Create a ZIP of your app
Compress-Archive -Path * -DestinationPath deploy.zip -Force

# Deploy to Azure
az webapp deployment source config-zip `
  --resource-group <your-resource-group> `
  --name hra-sweden `
  --src deploy.zip

# Clean up
Remove-Item deploy.zip
```

---

## Option 3: Deploy from Azure Portal

1. Go to https://portal.azure.com
2. Navigate to your App Service: **hra-sweden**
3. Go to **Deployment Center**
4. Click **"Browse"** or drag-drop a ZIP file
5. Click **"Deploy"**

---

## What's in this deployment:

✅ Force HTTPS for Azure App Service
✅ MSAL library with CDN fallbacks  
✅ `/api/auth/msal-config` endpoint
✅ Express trust proxy configuration
✅ MSAL debug tool at `/msal-debug.html`
✅ All JavaScript syntax fixes

---

## After Deployment:

Test these URLs:

1. **MSAL Config (must show HTTPS):**
   https://hra-sweden-dafdbdh4h4ghbxgm.swedencentral-01.azurewebsites.net/api/auth/msal-config

2. **Debug Tool:**
   https://hra-sweden-dafdbdh4h4ghbxgm.swedencentral-01.azurewebsites.net/msal-debug.html

3. **Main App:**
   https://hra-sweden-dafdbdh4h4ghbxgm.swedencentral-01.azurewebsites.net

4. **Test Microsoft Login** - should open popup and work!
