#!/usr/bin/env pwsh
# Azure Container Apps Deployment Script for HRA Safety Management System

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUsername,
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "rg-hra-safety",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "West Europe",
    
    [Parameter(Mandatory=$false)]
    [string]$AppName = "hra-safety-app"
)

Write-Host "🚀 Starting Azure Container Apps deployment for HRA Safety System" -ForegroundColor Green
Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "   Resource Group: $ResourceGroup" -ForegroundColor White
Write-Host "   Location: $Location" -ForegroundColor White
Write-Host "   App Name: $AppName" -ForegroundColor White
Write-Host "   GitHub User: $GitHubUsername" -ForegroundColor White

# Check if Azure CLI is installed
if (!(Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Azure CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

# Check if logged in to Azure
Write-Host "🔐 Checking Azure authentication..." -ForegroundColor Yellow
try {
    $account = az account show --output json 2>$null | ConvertFrom-Json
    if ($account) {
        Write-Host "✅ Logged in as: $($account.user.name)" -ForegroundColor Green
        Write-Host "📱 Subscription: $($account.name)" -ForegroundColor Green
    } else {
        throw "Not logged in"
    }
} catch {
    Write-Host "❌ Please login to Azure first:" -ForegroundColor Red
    Write-Host "   az login" -ForegroundColor Yellow
    exit 1
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create Web App" -ForegroundColor Red
    exit 1
}

# Configure App Settings
Write-Host "⚙️ Configuring application settings" -ForegroundColor Yellow
az webapp config appsettings set `
    --name $webAppName `
    --resource-group $resourceGroup `
    --settings `
        NODE_ENV=production `
        WEBSITE_NODE_DEFAULT_VERSION=18.x `
        JWT_SECRET="$(Get-Random)$(Get-Date -Format 'yyyyMMddHHmmss')" `
        AZURE_CLIENT_ID="eb9865fe-5d08-43ed-8ee9-6cad32b74981" `
        AZURE_TENANT_ID="81fa766e-a349-4867-8bf4-ab35e250a08f" `
        PORT=8080 `
        ALLOWED_ORIGINS="https://$webAppName.azurewebsites.net" `
        MAX_FILE_SIZE=52428800

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to configure app settings" -ForegroundColor Red
    exit 1
}

# Enable HTTPS Only
Write-Host "🔒 Enabling HTTPS only" -ForegroundColor Yellow
az webapp update --name $webAppName --resource-group $resourceGroup --https-only true

# Deploy Application
Write-Host "📤 Preparing application for deployment" -ForegroundColor Yellow

# Create Container Apps environment
$envName = "env-hra-safety"
Write-Host "🌍 Creating Container Apps environment: $envName..." -ForegroundColor Yellow
az containerapp env create `
  --name $envName `
  --resource-group $ResourceGroup `
  --location $Location

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create Container Apps environment" -ForegroundColor Red
    exit 1
}

# Build and push Docker image to GitHub Container Registry
$imageName = "ghcr.io/$GitHubUsername/hra-safety-app:latest"
Write-Host "🐳 Building Docker image: $imageName..." -ForegroundColor Yellow

# Check if Docker is available
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host "   Please install Docker Desktop first" -ForegroundColor Yellow
    exit 1
}

# Build the image
docker build -t $imageName .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build Docker image" -ForegroundColor Red
    exit 1
}

# Push to GitHub Container Registry
Write-Host "📤 Pushing image to GitHub Container Registry..." -ForegroundColor Yellow
docker push $imageName
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push Docker image" -ForegroundColor Red
    Write-Host "   Make sure you're authenticated with: docker login ghcr.io" -ForegroundColor Yellow
    exit 1
}

# Create Container App
Write-Host "🚀 Creating Container App: $AppName..." -ForegroundColor Yellow
az containerapp create `
  --name $AppName `
  --resource-group $ResourceGroup `
  --environment $envName `
  --image $imageName `
  --target-port 8080 `
  --ingress external `
  --env-vars `
    NODE_ENV=production `
    AZURE_CLIENT_ID=eb9865fe-5d08-43ed-8ee9-6cad32b74981 `
    AZURE_TENANT_ID=81fa766e-a349-4867-8bf4-ab35e250a08f `
    CLIENT_ID=eb9865fe-5d08-43ed-8ee9-6cad32b74981 `
    TENANT_ID=81fa766e-a349-4867-8bf4-ab35e250a08f

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create Container App" -ForegroundColor Red
    exit 1
}

# Get the app URL
Write-Host "🔍 Getting application URL..." -ForegroundColor Yellow
$appUrl = az containerapp show `
  --name $AppName `
  --resource-group $ResourceGroup `
  --query "properties.configuration.ingress.fqdn" `
  --output tsv

if ($appUrl) {
    $fullUrl = "https://$appUrl"
    
    Write-Host "" -ForegroundColor Green
    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    Write-Host "🌐 Your app is available at: $fullUrl" -ForegroundColor Cyan
    Write-Host "🩺 Health check: $fullUrl/health" -ForegroundColor Cyan
    Write-Host "" -ForegroundColor Green
    
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Update Azure AD redirect URIs to include: $fullUrl" -ForegroundColor White
    Write-Host "   2. Test the application by visiting the URL above" -ForegroundColor White
    Write-Host "   3. Monitor logs: az containerapp logs show --name $AppName --resource-group $ResourceGroup --follow" -ForegroundColor White
    Write-Host "" -ForegroundColor Green
    
    # Test health endpoint
    Write-Host "🔍 Testing health endpoint..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30  # Wait for app to start
    
    try {
        $healthResponse = Invoke-RestMethod -Uri "$fullUrl/health" -Method GET -TimeoutSec 30
        Write-Host "✅ Health check passed: $($healthResponse.status)" -ForegroundColor Green
        Write-Host "📊 App details: Uptime $($healthResponse.uptime), Database: $($healthResponse.database)" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Health check failed, but app may still be starting up" -ForegroundColor Yellow
        Write-Host "   Try manually: $fullUrl/health" -ForegroundColor White
    }
    
    Write-Host "" -ForegroundColor Green
    Write-Host "🎉 HRA Safety App is now live in Azure!" -ForegroundColor Green
    
} else {
    Write-Host "❌ Failed to get application URL" -ForegroundColor Red
    Write-Host "   Check the Azure portal for deployment status" -ForegroundColor Yellow
}