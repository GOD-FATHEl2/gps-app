@echo off
:: HRA MSAL Development Setup Script (Windows)
:: This script helps you quickly set up the development environment for MSAL testing

echo 🔧 HRA MSAL Development Setup
echo ==============================

:: Check if .env exists
if not exist ".env" (
    echo 📋 Creating .env from development template...
    copy ".env.development" ".env"
    echo ✅ Created .env file
) else (
    echo ⚠️  .env file already exists, skipping creation
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies already installed
)

echo.
echo 🔧 Next Steps:
echo 1. Edit .env and add your Azure AD configuration:
echo    - AZURE_CLIENT_ID (from Azure Portal)
echo    - AZURE_TENANT_ID (from Azure Portal)
echo    - AZURE_CLIENT_SECRET (from Azure Portal)
echo.
echo 2. Start the development server:
echo    npm start
echo.
echo 3. Open browser to http://localhost:8080
echo.
echo 4. Test MSAL authentication:
echo    - Use 'Logga in med Microsoft' for real Azure AD
echo    - Use 'Development Bypass' for testing without Azure AD
echo.
echo 📚 For more information, see:
echo    - MSAL-IMPLEMENTATION-COMPLETE.md
echo    - MSAL-Implementation-Guide.md
echo.
echo 🚀 Happy coding!
pause