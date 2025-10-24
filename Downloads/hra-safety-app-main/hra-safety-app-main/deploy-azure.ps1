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

# Create deployment package
$deployPackage = "hra-deployment.zip"
if (Test-Path $deployPackage) {
    Remove-Item $deployPackage
}

# Exclude unnecessary files and compress
$excludeFiles = @(
    "node_modules",
    ".git",
    "*.md",
    "*.log",
    "deploy-azure.ps1",
    "Dockerfile",
    ".dockerignore",
    "enhanced-schema.sql"
)

Compress-Archive -Path "./*" -DestinationPath $deployPackage -Force

Write-Host "🚀 Deploying application to Azure" -ForegroundColor Yellow
az webapp deployment source config-zip `
    --name $webAppName `
    --resource-group $resourceGroup `
    --src $deployPackage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to deploy application" -ForegroundColor Red
    exit 1
}

# Clean up deployment package
Remove-Item $deployPackage

# Get application URL
$appUrl = "https://$webAppName.azurewebsites.net"

Write-Host "" -ForegroundColor Green
Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "📱 Application URL: $appUrl" -ForegroundColor Cyan
Write-Host "🔧 Health Check: $appUrl/health" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Green
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update your Azure App Registration redirect URIs:" -ForegroundColor White
Write-Host "   - Web: $appUrl/auth/callback" -ForegroundColor Gray
Write-Host "   - SPA: $appUrl" -ForegroundColor Gray
Write-Host "2. Add your Azure client secret to app settings" -ForegroundColor White
Write-Host "3. Test the application: $appUrl" -ForegroundColor White
Write-Host "" -ForegroundColor Green

# Open application in browser
Start-Process $appUrl