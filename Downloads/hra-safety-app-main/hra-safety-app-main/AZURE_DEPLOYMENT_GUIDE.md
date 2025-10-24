# HRA Safety App - Complete Azure Deployment Guide

## 🚀 **Production Deployment Package**

✅ **Status: READY FOR DEPLOYMENT**
- Docker containerization complete
- Health checks implemented
- MSAL authentication working
- CI/CD pipeline configured

## 📋 Deployment Options

### Option 1: Azure Container Apps (Recommended)
Modern serverless containers with auto-scaling

### Option 2: Azure App Service  
Traditional web app hosting

### Option 3: Docker with GitHub Actions
Complete CI/CD automation

---

## 🐳 **Option 1: Azure Container Apps**

### **Prerequisites:**
1. Azure CLI installed
2. Azure subscription access
3. Docker installed locally
4. GitHub repository

### **Step 1: Create Azure Resources**

```bash
# Login to Azure
az login

# Create resource group
az group create --name "rg-hra-safety" --location "West Europe"

# Create Container Apps environment
az containerapp env create \
  --name "env-hra-safety" \
  --resource-group "rg-hra-safety" \
  --location "West Europe"

# Create Azure Container Registry
az acr create \
  --resource-group "rg-hra-safety" \
  --name "acrhrasafety" \
  --sku Basic
```

### **Step 2: Build and Push Docker Image**

```bash
# Build Docker image
docker build -t hra-safety-app .

# Tag for ACR
docker tag hra-safety-app acrhrasafety.azurecr.io/hra-safety-app:latest

# Login to ACR
az acr login --name acrhrasafety

# Push image
docker push acrhrasafety.azurecr.io/hra-safety-app:latest
```

### **Step 3: Deploy Container App**

```bash
# Create container app
az containerapp create \
  --name "hra-safety-app" \
  --resource-group "rg-hra-safety" \
  --environment "env-hra-safety" \
  --image "acrhrasafety.azurecr.io/hra-safety-app:latest" \
  --target-port 8080 \
  --ingress external \
  --registry-server "acrhrasafety.azurecr.io" \
  --env-vars \
    NODE_ENV=production \
    AZURE_CLIENT_ID="eb9865fe-5d08-43ed-8ee9-6cad32b74981" \
    AZURE_TENANT_ID="81fa766e-a349-4867-8bf4-ab35e250a08f"
```

### **Step 3: Deploy Application**

```bash
# Zip your application
cd "C:\Users\NEKKOU\Downloads\HRA\HRA"
tar -czf hra-app.tar.gz --exclude=node_modules --exclude=.git *

# Deploy to Azure
az webapp deployment source config-zip \
  --name "hra-safety-app" \
  --resource-group "rg-hra-safety" \
  --src hra-app.tar.gz
```

### **Step 4: Configure App Registration Redirect URIs**

Add these URLs to your Azure App Registration:
- **Web Redirect URI**: `https://hra-safety-app.azurewebsites.net/auth/callback`
- **SPA Redirect URI**: `https://hra-safety-app.azurewebsites.net`

### **Step 5: Set up Custom Domain (Optional)**

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name "hra-safety-app" \
  --resource-group "rg-hra-safety" \
  --hostname "hra.yourcompany.com"
```

## 🔧 **Required Files for Deployment:**

1. **web.config** - IIS configuration
2. **.env.production** - Environment variables
3. **Dockerfile** - Container configuration (if using containers)
4. **azure-pipelines.yml** - CI/CD pipeline (optional)

## 🔒 **Security Considerations:**

1. **Store secrets in Azure Key Vault**
2. **Enable HTTPS only**
3. **Configure CORS properly**
4. **Set up Application Insights for monitoring**

## 📊 **Post-Deployment Tasks:**

1. **Test authentication flow**
2. **Verify database persistence**
3. **Check file upload functionality**
4. **Monitor application logs**

## 🎯 **Estimated Costs:**

- **Basic (B1) App Service**: ~$13/month
- **Standard (S1) App Service**: ~$56/month (recommended for production)
- **Storage**: ~$1-5/month depending on usage

## 📞 **Next Steps:**

1. Choose your deployment method
2. Run the Azure CLI commands
3. Configure your app registration redirect URIs
4. Test the deployed application

Would you like me to create the specific configuration files for your deployment?