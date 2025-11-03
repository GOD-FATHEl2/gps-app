# Local development
cp .env.local .env
node server.local.js

# Azure deployment (Dockerfile or App Service)
# Azure will use server.js and .env.production or environment variables
