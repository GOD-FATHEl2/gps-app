# 🚀 GitHub Deployment Steps

## Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right and select "New repository"
3. Fill in the details:
   - **Repository name**: `hra-safety-app`
   - **Description**: `HRA Safety Management System for Volvo Cars - Azure AD Authentication, Docker, CI/CD`
   - **Visibility**: Public (or Private if preferred)
   - **Do NOT initialize** with README, .gitignore, or license (we already have these)
4. Click "Create repository"

## Step 2: Push Your Code to GitHub

Copy the commands below and run them in PowerShell:

```powershell
# Add the new GitHub repository as remote
git remote remove origin  # Remove current origin if exists
git remote add origin https://github.com/YOUR_USERNAME/hra-safety-app.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

## Step 3: Configure GitHub Secrets

After pushing, go to your GitHub repository:

1. Click **Settings** tab
2. Go to **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these secrets:

### Required Secrets:
```
AZURE_CREDENTIALS
# Azure Service Principal JSON (create via: az ad sp create-for-rbac)

AZURE_CLIENT_ID
# Value: eb9865fe-5d08-43ed-8ee9-6cad32b74981

AZURE_TENANT_ID  
# Value: 81fa766e-a349-4867-8bf4-ab35e250a08f

AZURE_CLIENT_SECRET
# Your Azure App Registration secret

JWT_SECRET
# Generate with: openssl rand -base64 32

SESSION_SECRET
# Generate with: openssl rand -base64 32
```

## Step 4: Create Azure Resources

Run these commands in Azure CLI (or Azure Cloud Shell):

```bash
# Login to Azure
az login

# Create resource group
az group create --name rg-hra-safety --location "West Europe"

# Create Container Apps environment
az containerapp env create \
  --name env-hra-safety \
  --resource-group rg-hra-safety \
  --location "West Europe"
```

## Step 5: Automatic Deployment

Once you push to the `main` branch, GitHub Actions will automatically:

1. Build the Docker image
2. Push to GitHub Container Registry  
3. Deploy to Azure Container Apps
4. Test the deployment

## Step 6: Manual Azure Deployment (Alternative)

If you prefer manual deployment:

```bash
# Deploy container app
az containerapp create \
  --name hra-safety-app \
  --resource-group rg-hra-safety \
  --environment env-hra-safety \
  --image ghcr.io/YOUR_USERNAME/hra-safety-app:latest \
  --target-port 8080 \
  --ingress external \
  --env-vars \
    NODE_ENV=production \
    AZURE_CLIENT_ID=eb9865fe-5d08-43ed-8ee9-6cad32b74981 \
    AZURE_TENANT_ID=81fa766e-a349-4867-8bf4-ab35e250a08f
```

## Step 7: Test Deployment

Your app will be available at:
- **Main App**: `https://hra-safety-app.azurecontainerapps.io`
- **Health Check**: `https://hra-safety-app.azurecontainerapps.io/health`

## Step 8: Update Azure AD Redirect URI

In Azure Portal:
1. Go to **App registrations** → Your app (`eb9865fe-5d08-43ed-8ee9-6cad32b74981`)
2. Click **Authentication**
3. Add redirect URI: `https://hra-safety-app.azurecontainerapps.io`
4. Save changes

## 🎉 Deployment Complete!

Your HRA Safety App will be live and ready for Volvo Cars users!

---

**Ready to start? Follow Step 1 above! 🚀**