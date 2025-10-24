# 🔐 Complete MSAL Authentication Implementation Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Azure AD Setup](#azure-ad-setup)
3. [Frontend Implementation](#frontend-implementation)
4. [Backend Implementation (Optional)](#backend-implementation-optional)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Common Issues & Solutions](#common-issues--solutions)
8. [Advanced Features](#advanced-features)
9. [Best Practices](#best-practices)

---

## Prerequisites

### Required Tools
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Python 3.8+** (for backend)
- **Azure Account** with admin permissions
- **Code Editor** (VS Code recommended)

### Knowledge Requirements
- Basic React/JavaScript knowledge
- Understanding of authentication concepts
- Basic Azure familiarity

---

## Azure AD Setup

### Step 1: Create Azure AD App Registration

1. **Go to Azure Portal**
   - Navigate to [portal.azure.com](https://portal.azure.com)
   - Sign in with your Azure account

2. **Access Azure Active Directory**
   ```
   Home → Azure Active Directory → App registrations → New registration
   ```

3. **Register Your Application**
   ```
   Name: MyApp-MSAL
   Supported account types: Accounts in this organizational directory only
   Redirect URI: 
     - Type: Single-page application (SPA)
     - URI: http://localhost:3000
   ```

4. **Click "Register"**

### Step 2: Configure App Registration

1. **Note Important Values**
   ```
   Application (client) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   Directory (tenant) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

2. **Configure Authentication**
   ```
   Authentication → Platform configurations → Add a platform → Single-page application
   
   Redirect URIs:
   - http://localhost:3000
   - http://localhost:3000/
   - https://yourdomain.com (for production)
   
   Logout URL: http://localhost:3000/logout
   
   Implicit grant and hybrid flows:
   ☑ Access tokens (used for implicit flows)
   ☑ ID tokens (used for implicit and hybrid flows)
   ```

3. **Set API Permissions**
   ```
   API permissions → Add a permission → Microsoft Graph → Delegated permissions
   
   Add these permissions:
   - User.Read (Default)
   - email
   - openid
   - profile
   - offline_access (for refresh tokens)
   ```

4. **Grant Admin Consent** (if required)
   ```
   API permissions → Grant admin consent for [Your Organization]
   ```

---

## Frontend Implementation

### Step 1: Create Project Structure

```bash
# Create new React project (if starting fresh)
npx create-react-app my-msal-app
cd my-msal-app

# OR for Vite (recommended)
npm create vite@latest my-msal-app -- --template react
cd my-msal-app
```

### Step 2: Install MSAL Dependencies

```bash
npm install @azure/msal-browser @azure/msal-react axios react-router-dom
```

### Step 3: Create Environment Configuration

**Create `.env` file:**
```env
# Azure AD Configuration
REACT_APP_AZURE_CLIENT_ID=your-client-id-from-azure
REACT_APP_AZURE_TENANT_ID=your-tenant-id-from-azure
REACT_APP_REDIRECT_URI=http://localhost:3000

# API Configuration (optional)
REACT_APP_API_BASE_URL=http://localhost:8000/api

# Development settings
REACT_APP_NODE_ENV=development
```

**For Vite projects, use `VITE_` prefix:**
```env
VITE_AZURE_CLIENT_ID=your-client-id-from-azure
VITE_AZURE_TENANT_ID=your-tenant-id-from-azure
VITE_REDIRECT_URI=http://localhost:3000
```

### Step 4: Create MSAL Configuration

**Create `src/authConfig.js`:**
```javascript
import { LogLevel } from "@azure/msal-browser";

// For Create React App
const clientId = process.env.REACT_APP_AZURE_CLIENT_ID;
const tenantId = process.env.REACT_APP_AZURE_TENANT_ID;

// For Vite
// const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
// const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;

export const msalConfig = {
    auth: {
        clientId: clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri: window.location.origin,
        postLogoutRedirectUri: "/",
        navigateToLoginRequestUrl: false,
    },
    cache: {
        cacheLocation: "sessionStorage", // "localStorage" or "sessionStorage"
        storeAuthStateInCookie: false,
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) return;
                
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        break;
                    case LogLevel.Info:
                        console.info(message);
                        break;
                    case LogLevel.Verbose:
                        console.debug(message);
                        break;
                    case LogLevel.Warning:
                        console.warn(message);
                        break;
                }
            }
        }
    }
};

// Scopes for login
export const loginRequest = {
    scopes: ["User.Read"]
};

// Scopes for Microsoft Graph API
export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};

// Development mock user (for testing)
export const devMockUser = {
    username: 'dev@example.com',
    name: 'Development User',
    homeAccountId: 'dev-mock-account'
};
```

### Step 5: Create Custom Auth Hook

**Create `src/hooks/useAuth.js`:**
```javascript
import { useState, useEffect } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { loginRequest, devMockUser } from '../authConfig';

export const useAuth = () => {
    const { instance, accounts, inProgress } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [error, setError] = useState(null);

    const account = accounts[0];

    // Update user when account changes
    useEffect(() => {
        if (account) {
            setUser({
                name: account.name,
                email: account.username,
                id: account.localAccountId
            });
        } else if (localStorage.getItem('devBypass')) {
            setUser(devMockUser);
        } else {
            setUser(null);
        }
    }, [account]);

    // Login function
    const login = async () => {
        try {
            setError(null);
            await instance.loginRedirect(loginRequest);
        } catch (error) {
            console.error('Login error:', error);
            setError(error);
        }
    };

    // Logout function
    const logout = async () => {
        try {
            setError(null);
            
            if (localStorage.getItem('devBypass')) {
                localStorage.removeItem('devBypass');
                setUser(null);
                window.location.href = '/';
                return;
            }

            await instance.logoutRedirect({
                postLogoutRedirectUri: window.location.origin
            });
        } catch (error) {
            console.error('Logout error:', error);
            setError(error);
        }
    };

    // Development bypass (for testing without Azure AD)
    const skipLogin = () => {
        if (process.env.NODE_ENV === 'development') {
            localStorage.setItem('devBypass', 'true');
            setUser(devMockUser);
            setAccessToken('dev-mock-token');
        }
    };

    // Get access token
    const getAccessToken = async (scopes = loginRequest.scopes) => {
        if (!account && !localStorage.getItem('devBypass')) {
            throw new Error('User not logged in');
        }

        if (localStorage.getItem('devBypass')) {
            return 'dev-mock-token';
        }

        try {
            const response = await instance.acquireTokenSilent({
                scopes,
                account
            });
            setAccessToken(response.accessToken);
            return response.accessToken;
        } catch (error) {
            if (error instanceof InteractionRequiredAuthError) {
                const response = await instance.acquireTokenRedirect({
                    scopes,
                    account
                });
                return response.accessToken;
            }
            throw error;
        }
    };

    return {
        isAuthenticated: isAuthenticated || !!localStorage.getItem('devBypass'),
        user,
        accessToken,
        error,
        login,
        logout,
        skipLogin,
        getAccessToken,
        inProgress
    };
};
```

### Step 6: Create Components

**Create `src/components/Login.jsx`:**
```javascript
import React from 'react';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
    const { login, skipLogin, error, inProgress } = useAuth();

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1>Welcome</h1>
                <p>Please sign in to continue</p>
                
                {error && (
                    <div style={styles.error}>
                        Error: {error.message}
                    </div>
                )}
                
                <button 
                    onClick={login}
                    disabled={inProgress === 'login'}
                    style={styles.loginButton}
                >
                    {inProgress === 'login' ? 'Signing in...' : 'Sign in with Microsoft'}
                </button>
                
                {process.env.NODE_ENV === 'development' && (
                    <button 
                        onClick={skipLogin}
                        style={styles.skipButton}
                    >
                        Skip Login (Dev Mode)
                    </button>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    card: {
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
    },
    loginButton: {
        width: '100%',
        padding: '12px',
        background: '#0078d4',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '16px',
        cursor: 'pointer',
        marginBottom: '10px'
    },
    skipButton: {
        width: '100%',
        padding: '12px',
        background: '#f3f2f1',
        color: '#323130',
        border: '1px solid #d2d0ce',
        borderRadius: '4px',
        fontSize: '16px',
        cursor: 'pointer'
    },
    error: {
        background: '#fee',
        color: '#c33',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '15px'
    }
};

export default Login;
```

**Create `src/components/UserProfile.jsx`:**
```javascript
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const UserProfile = () => {
    const { user, logout, getAccessToken } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchMicrosoftGraphProfile = async () => {
        setLoading(true);
        try {
            const token = await getAccessToken();
            
            const response = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setProfileData(data);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1>Welcome, {user?.name}!</h1>
                <button onClick={logout} style={styles.logoutButton}>
                    Sign Out
                </button>
            </div>
            
            <div style={styles.content}>
                <div style={styles.section}>
                    <h3>User Information</h3>
                    <p><strong>Name:</strong> {user?.name}</p>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>ID:</strong> {user?.id}</p>
                </div>
                
                <div style={styles.section}>
                    <h3>Microsoft Graph</h3>
                    <button 
                        onClick={fetchMicrosoftGraphProfile}
                        disabled={loading}
                        style={styles.button}
                    >
                        {loading ? 'Loading...' : 'Fetch Graph Profile'}
                    </button>
                    
                    {profileData && (
                        <pre style={styles.code}>
                            {JSON.stringify(profileData, null, 2)}
                        </pre>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
    },
    logoutButton: {
        padding: '10px 20px',
        background: '#d13438',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    content: {
        display: 'grid',
        gap: '20px'
    },
    section: {
        background: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px'
    },
    button: {
        padding: '10px 20px',
        background: '#0078d4',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    code: {
        background: '#2d3748',
        color: '#e2e8f0',
        padding: '15px',
        borderRadius: '4px',
        overflow: 'auto',
        marginTop: '10px'
    }
};

export default UserProfile;
```

**Create `src/components/ProtectedRoute.jsx`:**
```javascript
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Login from './Login';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, inProgress } = useAuth();

    if (inProgress === 'startup') {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Login />;
    }

    return children;
};

export default ProtectedRoute;
```

### Step 7: Update Main App

**Update `src/App.js`:**
```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import UserProfile from './components/UserProfile';
import Login from './components/Login';
import { useAuth } from './hooks/useAuth';

function App() {
    const { isAuthenticated } = useAuth();

    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route 
                        path="/login" 
                        element={isAuthenticated ? <Navigate to="/profile" /> : <Login />} 
                    />
                    <Route 
                        path="/profile" 
                        element={
                            <ProtectedRoute>
                                <UserProfile />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/" 
                        element={<Navigate to={isAuthenticated ? "/profile" : "/login"} />} 
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
```

### Step 8: Initialize MSAL

**Update `src/index.js` (Create React App):**
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './authConfig';
import App from './App';
import './index.css';

const msalInstance = new PublicClientApplication(msalConfig);

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <React.StrictMode>
        <MsalProvider instance={msalInstance}>
            <App />
        </MsalProvider>
    </React.StrictMode>
);
```

**For Vite, update `src/main.jsx`:**
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { msalConfig } from './authConfig'
import App from './App.jsx'
import './index.css'

const msalInstance = new PublicClientApplication(msalConfig);

await msalInstance.initialize();

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <MsalProvider instance={msalInstance}>
            <App />
        </MsalProvider>
    </React.StrictMode>,
)
```

---

## Backend Implementation (Optional)

### Step 1: Setup Python Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn python-jose[cryptography] requests python-dotenv
```

### Step 2: Create Backend Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── auth/
│   │   ├── __init__.py
│   │   └── auth.py
│   └── core/
│       ├── __init__.py
│       └── config.py
├── .env
└── requirements.txt
```

### Step 3: Backend Configuration

**Create `app/core/config.py`:**
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    azure_tenant_id: str = ""
    azure_client_id: str = ""
    azure_client_secret: str = ""
    
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173"
    ]
    
    class Config:
        env_file = ".env"

settings = Settings()
```

**Create `.env`:**
```env
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

### Step 4: Authentication Module

**Create `app/auth/auth.py`:**
```python
import requests
from jose import jwt
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer
from app.core.config import settings

security = HTTPBearer()

def get_jwks_keys():
    """Fetch JWKS keys from Azure AD"""
    jwks_url = f"https://login.microsoftonline.com/{settings.azure_tenant_id}/discovery/v2.0/keys"
    response = requests.get(jwks_url)
    return response.json()

def verify_token(token: str):
    """Verify JWT token"""
    try:
        # Get signing keys
        jwks = get_jwks_keys()
        
        # Decode token header
        unverified_header = jwt.get_unverified_header(token)
        
        # Find the right key
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
        
        if rsa_key:
            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=["RS256"],
                audience=settings.azure_client_id,
                issuer=f"https://login.microsoftonline.com/{settings.azure_tenant_id}/v2.0"
            )
            return payload
        else:
            raise HTTPException(status_code=401, detail="Unable to find appropriate key")
            
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token validation failed: {str(e)}")

async def get_current_user(credentials = Depends(security)):
    """Get current user from token"""
    token = credentials.credentials
    payload = verify_token(token)
    
    return {
        "id": payload.get("oid"),
        "name": payload.get("name"),
        "email": payload.get("email") or payload.get("preferred_username")
    }
```

### Step 5: Main FastAPI App

**Create `app/main.py`:**
```python
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.auth.auth import get_current_user

app = FastAPI(title="MSAL Backend API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "MSAL Backend API"}

@app.get("/api/profile")
async def get_profile(current_user = Depends(get_current_user)):
    return {"user": current_user}

@app.get("/api/protected")
async def protected_endpoint(current_user = Depends(get_current_user)):
    return {"message": f"Hello {current_user['name']}!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## Configuration

### Environment Variables

**Frontend (.env):**
```env
# Required
REACT_APP_AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
REACT_APP_AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Optional
REACT_APP_REDIRECT_URI=http://localhost:3000
REACT_APP_API_BASE_URL=http://localhost:8000
```

**Backend (.env):**
```env
# Required
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Optional (for advanced scenarios)
AZURE_CLIENT_SECRET=your-secret-here
```

### Production Configuration

**Frontend:**
- Update redirect URIs in Azure AD
- Set production environment variables
- Enable HTTPS
- Configure proper CORS origins

**Backend:**
- Use environment-specific configurations
- Enable proper logging
- Configure rate limiting
- Set up monitoring

---

## Testing

### Step 1: Start Development Servers

```bash
# Frontend
npm start
# or for Vite
npm run dev

# Backend (if using)
python app/main.py
# or
uvicorn app.main:app --reload
```

### Step 2: Test Authentication Flow

1. **Open browser** to `http://localhost:3000`
2. **Click "Sign in with Microsoft"**
3. **Complete Azure AD login**
4. **Verify user profile display**
5. **Test API calls** (if backend implemented)
6. **Test logout functionality**

### Step 3: Development Mode Testing

1. **Use "Skip Login" button** in development
2. **Verify mock user functionality**
3. **Test protected routes**

---

## Common Issues & Solutions

### Issue 1: "AADSTS50011: The reply URL specified in the request does not match"

**Solution:**
```
1. Check Azure AD App Registration → Authentication
2. Ensure redirect URI matches exactly: http://localhost:3000
3. Add trailing slash variant: http://localhost:3000/
```

### Issue 2: "CORS policy error"

**Solution:**
```javascript
// In backend CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  // Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 3: "Token validation failed"

**Solution:**
```
1. Check Azure AD app permissions
2. Verify client ID and tenant ID
3. Ensure proper token audience configuration
4. Check token expiration
```

### Issue 4: "User not found" after login

**Solution:**
```javascript
// In useAuth hook, ensure proper account handling
const account = accounts && accounts.length > 0 ? accounts[0] : null;
```

---

## Advanced Features

### 1. Silent Token Refresh

```javascript
// In useAuth hook
const refreshToken = async () => {
    try {
        const response = await instance.acquireTokenSilent({
            scopes: loginRequest.scopes,
            account: account
        });
        setAccessToken(response.accessToken);
        return response.accessToken;
    } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
            // Fallback to interactive
            return await instance.acquireTokenRedirect({
                scopes: loginRequest.scopes,
                account: account
            });
        }
        throw error;
    }
};
```

### 2. Multiple Scopes

```javascript
// Different scopes for different APIs
export const graphRequest = {
    scopes: ["https://graph.microsoft.com/User.Read"]
};

export const customApiRequest = {
    scopes: ["api://your-api-id/access_as_user"]
};
```

### 3. Conditional Rendering

```javascript
// Based on user roles or permissions
const UserDashboard = () => {
    const { user } = useAuth();
    
    return (
        <div>
            {user?.roles?.includes('admin') && (
                <AdminPanel />
            )}
            <UserContent />
        </div>
    );
};
```

### 4. API Integration

```javascript
// Service for authenticated API calls
export const apiService = {
    async callWithAuth(url, options = {}) {
        const { getAccessToken } = useAuth();
        const token = await getAccessToken();
        
        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            }
        });
    }
};
```

---

## Best Practices

### Security
1. **Never expose client secrets** in frontend code
2. **Use HTTPS** in production
3. **Validate tokens** on the backend
4. **Implement proper error handling**
5. **Use least privilege principle** for scopes

### Performance
1. **Cache tokens** appropriately
2. **Use silent token refresh**
3. **Implement loading states**
4. **Minimize API calls**

### User Experience
1. **Provide clear error messages**
2. **Show loading indicators**
3. **Handle network failures gracefully**
4. **Support offline scenarios**

### Code Organization
1. **Separate auth logic** into hooks/services
2. **Use environment variables** for configuration
3. **Implement proper TypeScript types**
4. **Write unit tests** for auth flows

---

## Production Deployment

### Frontend Deployment
1. **Update Azure AD redirect URIs** with production URLs
2. **Set production environment variables**
3. **Enable HTTPS**
4. **Configure CDN** if needed

### Backend Deployment
1. **Use environment-specific configs**
2. **Enable logging and monitoring**
3. **Configure rate limiting**
4. **Set up health checks**

### Security Checklist
- ✅ HTTPS enabled
- ✅ Proper CORS configuration
- ✅ Environment variables secured
- ✅ Token validation implemented
- ✅ Error handling in place
- ✅ Monitoring configured

---

## Additional Resources

- [Microsoft MSAL.js Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-overview)
- [Azure AD App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Microsoft Graph API Reference](https://docs.microsoft.com/en-us/graph/api/overview)
- [MSAL React Samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples)

---

## Support

For issues and questions:
1. Check the [Common Issues](#common-issues--solutions) section
2. Review Azure AD logs in the portal
3. Check browser developer console
4. Refer to Microsoft documentation
5. Search GitHub issues in MSAL.js repository

---

**Happy coding! 🚀**