# Deploy HRA Safety App to Azure App Service
# This script deploys the app directly to hra-sweden Azure App Service

Write-Host "🚀 Starting deployment to Azure..." -ForegroundColor Green
Write-Host ""

# Check if Azure CLI is installed
try {
    $azVersion = az version 2>$null
    if (-not $azVersion) {
        throw "Azure CLI not found"
    }
    Write-Host "✅ Azure CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI is not installed!" -ForegroundColor Red
    Write-Host "Please install from: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "OR use VS Code deployment (easier):" -ForegroundColor Yellow
    Write-Host "1. Right-click 'hra-safety-app-main' folder" -ForegroundColor Yellow
    Write-Host "2. Select 'Deploy to Web App...'" -ForegroundColor Yellow
    Write-Host "3. Choose 'hra-sweden'" -ForegroundColor Yellow
    exit 1
}

# Login check
Write-Host "🔐 Checking Azure login..." -ForegroundColor Cyan
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "⚠️  Not logged in to Azure" -ForegroundColor Yellow
    Write-Host "Opening Azure login..." -ForegroundColor Cyan
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Azure login failed!" -ForegroundColor Red
        exit 1
    }
}

$account = az account show | ConvertFrom-Json
Write-Host "✅ Logged in as: $($account.user.name)" -ForegroundColor Green
Write-Host "✅ Subscription: $($account.name)" -ForegroundColor Green
Write-Host ""

# Get app details
$appName = "hra-sweden"
Write-Host "📦 Getting app details for: $appName" -ForegroundColor Cyan

try {
    $appInfo = az webapp show --name $appName --query "{rg:resourceGroup,state:state,url:defaultHostName}" -o json 2>$null | ConvertFrom-Json
    
    if (-not $appInfo) {
        throw "App not found"
    }
    
    Write-Host "✅ App found:" -ForegroundColor Green
    Write-Host "   Resource Group: $($appInfo.rg)" -ForegroundColor White
    Write-Host "   State: $($appInfo.state)" -ForegroundColor White
    Write-Host "   URL: https://$($appInfo.url)" -ForegroundColor White
    Write-Host ""
    
    $resourceGroup = $appInfo.rg
} catch {
    Write-Host "❌ Could not find app '$appName'" -ForegroundColor Red
    Write-Host "Please check the app name and try again" -ForegroundColor Yellow
    exit 1
}

# Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Cyan

# Temporary deployment directory
$tempDir = Join-Path $env:TEMP "hra-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Copy files (exclude unnecessary files)
$excludeDirs = @('.git', 'node_modules', '.github', '.vscode', 'uploads')
$excludeFiles = @('*.db', '*.db-shm', '*.db-wal', '.env.local', 'deploy.zip')

Write-Host "   Copying files..." -ForegroundColor Gray
Get-ChildItem -Path . -Recurse | Where-Object {
    $item = $_
    $shouldExclude = $false
    
    # Check if in excluded directory
    foreach ($dir in $excludeDirs) {
        if ($item.FullName -like "*\$dir\*" -or $item.FullName -like "*/$dir/*") {
            $shouldExclude = $true
            break
        }
    }
    
    # Check if excluded file
    if (-not $shouldExclude -and $item -is [System.IO.FileInfo]) {
        foreach ($pattern in $excludeFiles) {
            if ($item.Name -like $pattern) {
                $shouldExclude = $true
                break
            }
        }
    }
    
    -not $shouldExclude
} | Copy-Item -Destination {
    $relativePath = $_.FullName.Substring((Get-Location).Path.Length + 1)
    $destPath = Join-Path $tempDir $relativePath
    $destDir = Split-Path $destPath -Parent
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    $destPath
}

# Create ZIP
$zipPath = Join-Path (Get-Location) "azure-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
Write-Host "   Creating ZIP: $zipPath" -ForegroundColor Gray
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force

# Clean up temp directory
Remove-Item -Path $tempDir -Recurse -Force

$zipSize = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
Write-Host "✅ Package created: $zipSize MB" -ForegroundColor Green
Write-Host ""

# Deploy to Azure
Write-Host "🚀 Deploying to Azure App Service..." -ForegroundColor Cyan
Write-Host "   This may take 2-3 minutes..." -ForegroundColor Gray
Write-Host ""

try {
    az webapp deployment source config-zip `
        --resource-group $resourceGroup `
        --name $appName `
        --src $zipPath `
        --timeout 300
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Deployment successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 Your app is available at:" -ForegroundColor Cyan
        Write-Host "   https://hra-sweden-dafdbdh4h4ghbxgm.swedencentral-01.azurewebsites.net" -ForegroundColor White
        Write-Host ""
        Write-Host "📋 Test these endpoints:" -ForegroundColor Cyan
        Write-Host "   MSAL Config: https://hra-sweden-dafdbdh4h4ghbxgm.swedencentral-01.azurewebsites.net/api/auth/msal-config" -ForegroundColor White
        Write-Host "   Debug Tool:  https://hra-sweden-dafdbdh4h4ghbxgm.swedencentral-01.azurewebsites.net/msal-debug.html" -ForegroundColor White
        Write-Host ""
        
        # Clean up ZIP
        Write-Host "🧹 Cleaning up..." -ForegroundColor Gray
        Remove-Item -Path $zipPath -Force
        Write-Host "✅ Done!" -ForegroundColor Green
    } else {
        throw "Deployment failed with exit code: $LASTEXITCODE"
    }
} catch {
    Write-Host ""
    Write-Host "❌ Deployment failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative: Use VS Code deployment" -ForegroundColor Yellow
    Write-Host "1. Right-click 'hra-safety-app-main' folder" -ForegroundColor Yellow
    Write-Host "2. Select 'Deploy to Web App...'" -ForegroundColor Yellow
    Write-Host "3. Choose 'hra-sweden'" -ForegroundColor Yellow
    
    # Keep ZIP for manual deployment
    if (Test-Path $zipPath) {
        Write-Host ""
        Write-Host "📦 Deployment package saved: $zipPath" -ForegroundColor Cyan
        Write-Host "   You can upload this manually in Azure Portal" -ForegroundColor Gray
    }
    
    exit 1
}
