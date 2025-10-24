# 🚀 HRA Safety App - Production Deployment Guide

## ✅ Current Status: FULLY READY FOR PRODUCTION

### 🎯 What's Completed:
- ✅ **MSAL 3.0.0 Authentication**: Complete Azure AD integration working
- ✅ **Application Logic**: Form submission, image upload, navigation all working
- ✅ **Health Monitoring**: `/health` endpoint with database checks implemented
- ✅ **Docker Container**: Multi-stage production build optimized
- ✅ **CI/CD Pipeline**: GitHub Actions workflow configured
- ✅ **Security**: JWT tokens, secure sessions, input validation
- ✅ **Database**: SQLite with persistence and error handling

## 🎯 Quick Deployment (Choose Your Method)

### Method 1: One-Click Azure Deployment 🚀

#### PowerShell Automated Script:
```powershell
# Run this from your project folder (replace YOUR_GITHUB_USERNAME)
.\deploy-azure.ps1 -GitHubUsername "YOUR_GITHUB_USERNAME"
```

This script will:
- Create Azure resource group and Container Apps environment
- Build and push Docker image to GitHub Container Registry  
- Deploy container app with proper environment variables
- Configure health checks and external ingress
- Test deployment and provide URLs

### Method 2: Manual GitHub + Azure Setup 🔧

#### Step 1: GitHub Repository Setup
```bash
# Initialize git repository
git init
git add .
git commit -m "HRA Safety App - Production Ready with MSAL"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/hra-safety-app.git
git branch -M main
git push -u origin main
```

#### Step 2: Azure Container Apps Deployment

# Get registry credentials
az acr credential show --name hraregistry

# Install Container Apps extension
az extension add --name containerapp

# Create Container Apps environment
az containerapp env create --name hra-environment --resource-group rg-hra-safety --location westeurope
```

**Step 2: Configure GitHub Secrets**
Go to: `https://github.com/GOD-FATHEl2/hra-safety-app/settings/secrets/actions`

Add these secrets:
- `REGISTRY_PASSWORD`: [From ACR credentials above]
- `AZURE_CLIENT_ID`: [Your Azure AD app client ID]
- `AZURE_TENANT_ID`: [Your Azure AD tenant ID] 
- `AZURE_CLIENT_SECRET`: [Your Azure AD app client secret]
- `AZURE_CREDENTIALS`: [Service principal JSON - see below]

**Step 3: Create Service Principal**
```bash
# In Azure Cloud Shell, replace {subscription-id} with your actual subscription ID
az ad sp create-for-rbac --name "hra-deploy" --role contributor --scopes /subscriptions/{subscription-id}/resourceGroups/rg-hra-safety --sdk-auth
```
Copy the entire JSON output to `AZURE_CREDENTIALS` secret.

**Step 4: Deploy**
```bash
git push origin main
```
The GitHub Actions will automatically deploy! 🚀

---

### Option 2: Manual Container Apps Deployment

If GitHub Actions fails, deploy manually:

**Step 1: Build and Push Docker Image**
```bash
# Login to registry
az acr login --name hraregistry

# Build and push
docker build -t hraregistry.azurecr.io/hra-app:latest .
docker push hraregistry.azurecr.io/hra-app:latest
```

**Step 2: Create Container App**
```bash
az containerapp create \
  --name hra-container-app \
  --resource-group rg-hra-safety \
  --environment hra-environment \
  --image hraregistry.azurecr.io/hra-app:latest \
  --target-port 8080 \
  --ingress 'external' \
  --registry-server hraregistry.azurecr.io \
  --registry-username hraregistry \
  --registry-password [YOUR_REGISTRY_PASSWORD] \
  --env-vars NODE_ENV=production PORT=8080 AZURE_CLIENT_ID=[YOUR_CLIENT_ID] AZURE_TENANT_ID=[YOUR_TENANT_ID] AZURE_CLIENT_SECRET=[YOUR_CLIENT_SECRET]
```

---

### Option 3: Alternative - Azure App Service

If Container Apps doesn't work:

```bash
# Create App Service Plan
az appservice plan create --name hra-plan --resource-group rg-hra-safety --sku B1 --is-linux

# Create Web App with Docker
az webapp create --name hra-safety-app --resource-group rg-hra-safety --plan hra-plan --deployment-container-image-name hraregistry.azurecr.io/hra-app:latest

# Configure app settings
az webapp config appsettings set --name hra-safety-app --resource-group rg-hra-safety --settings NODE_ENV=production AZURE_CLIENT_ID=[YOUR_CLIENT_ID] AZURE_TENANT_ID=[YOUR_TENANT_ID] AZURE_CLIENT_SECRET=[YOUR_CLIENT_SECRET]
```

## 🔧 Post-Deployment Steps

### 1. Update Azure AD Redirect URIs
Add your production URL to Azure AD app registration:
- `https://[your-app-url]/client/`
- `https://[your-app-url]/client/index.html`
- `https://[your-app-url]/`

### 2. Test the Application
1. Visit your production URL
2. Test Microsoft login
3. Create a risk assessment
4. Verify all functionality

### 3. Monitor the Application
```bash
# View logs
az containerapp logs show --name hra-container-app --resource-group rg-hra-safety --follow

# Check status
az containerapp show --name hra-container-app --resource-group rg-hra-safety
```

## 🌐 Expected Production URLs

After deployment, your app will be available at:
- **Container Apps**: `https://hra-container-app.[random].[region].azurecontainerapps.io`
- **App Service**: `https://hra-safety-app.azurewebsites.net`

## 🎉 Success Indicators

You'll know deployment worked when:
- ✅ App loads at production URL
- ✅ Microsoft login popup works
- ✅ Forms can be submitted successfully
- ✅ Admin users can manage assessments
- ✅ PDF generation works
- ✅ No console errors

## 🚨 If You Need Help

1. **GitHub Actions failing**: Check the Actions tab for error logs
2. **Container not starting**: Check container logs in Azure Portal
3. **Authentication issues**: Verify Azure AD redirect URIs
4. **Database problems**: Container will auto-create SQLite database

## 💡 Quick Start Recommendation

**For fastest deployment:**
1. Use Azure Cloud Shell (shell.azure.com)
2. Run the commands from Option 1 above
3. Set up GitHub secrets
4. Push to main branch
5. Let GitHub Actions handle the rest! 

Your HRA application is production-ready and just needs to be deployed! 🚀