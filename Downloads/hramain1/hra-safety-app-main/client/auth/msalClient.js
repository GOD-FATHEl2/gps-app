
// Ensure MSAL_CONFIG is set before MSALAuthService is instantiated
async function setupMSALAuthService() {
    if (!window.MSAL_CONFIG) {
        // Fetch config from backend
        try {
            const response = await fetch('/api/auth/msal-config');
            if (response.ok) {
                const config = await response.json();
                // Force https and correct callback path
                config.redirectUri = 'https://hra-sweden-dafdbdh4h4ghbxgm.swedencentral-01.azurewebsites.net/auth/callback';
                window.MSAL_CONFIG = config;
            } else {
                throw new Error('Failed to fetch MSAL config');
            }
        } catch (e) {
            console.error('Could not fetch MSAL config:', e);
        }
    }
    window.msalAuthService = new MSALAuthService();
}

// MSAL Browser Authentication for HRA Frontend
class MSALAuthService {
    constructor() {
        this.msalInstance = null;
        this.account = null;
        this.initializeMSAL();
    }

    async initializeMSAL() {
        try {
            // Import MSAL from CDN
            if (typeof msal === 'undefined') {
                await this.loadMSALScript();
            }

            const msalConfig = {
                auth: {
                    clientId: window.MSAL_CONFIG?.clientId || 'your-client-id',
                    authority: window.MSAL_CONFIG?.authority || 'https://login.microsoftonline.com/your-tenant-id',
                    redirectUri: window.MSAL_CONFIG?.redirectUri || (window.location.origin + '/auth/callback')
                },
                cache: {
                    cacheLocation: "sessionStorage",
                    storeAuthStateInCookie: false,
                },
                system: {
                    loggerOptions: {
                        loggerCallback: (level, message, containsPii) => {
                            if (level <= 1) {
                                console.error('MSAL Error:', message);
                            }
                        }
                    }
                }
            };

            this.msalInstance = new msal.PublicClientApplication(msalConfig);
            await this.msalInstance.initialize();
            
            // Handle redirect response
            await this.handleRedirectResponse();
            
        } catch (error) {
            console.error('Failed to initialize MSAL:', error);
        }
    }

    async loadMSALScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://alcdn.msauth.net/browser/2.38.3/js/msal-browser.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async handleRedirectResponse() {
        try {
            const response = await this.msalInstance.handleRedirectPromise();
            if (response) {
                this.account = response.account;
                await this.exchangeTokenForHRAAuth(response.accessToken);
            } else {
                // Check if user is already signed in
                const accounts = this.msalInstance.getAllAccounts();
                if (accounts.length > 0) {
                    this.account = accounts[0];
                }
            }
        } catch (error) {
            console.error('Error handling redirect:', error);
        }
    }

    async login() {
        try {
            const loginRequest = {
                scopes: ["https://graph.microsoft.com/User.Read"],
                prompt: "select_account"
            };

            const response = await this.msalInstance.loginPopup(loginRequest);
            this.account = response.account;
            
            // Exchange Microsoft token for HRA token
            await this.exchangeTokenForHRAAuth(response.accessToken);
            
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    async exchangeTokenForHRAAuth(accessToken) {
        try {
            const response = await fetch('/api/auth/msal-exchange', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accessToken })
            });

            if (!response.ok) {
                throw new Error('Failed to exchange token');
            }

            const data = await response.json();
            
            // Store HRA token
            localStorage.setItem('hra_token', data.token);
            localStorage.setItem('hra_user', JSON.stringify(data.user));
            
            // Redirect to dashboard
            window.location.href = '/client/dashboard.html';
            
        } catch (error) {
            console.error('Token exchange failed:', error);
            throw error;
        }
    }

    async logout() {
        try {
            // Clear HRA session
            localStorage.removeItem('hra_token');
            localStorage.removeItem('hra_user');
            
            // MSAL logout
            const logoutRequest = {
                account: this.account,
                postLogoutRedirectUri: window.location.origin
            };
            
            await this.msalInstance.logoutPopup(logoutRequest);
            
        } catch (error) {
            console.error('Logout failed:', error);
            // Force local logout even if MSAL fails
            localStorage.clear();
            window.location.href = '/';
        }
    }

    isAuthenticated() {
        return !!localStorage.getItem('hra_token');
    }

    getCurrentUser() {
        const userStr = localStorage.getItem('hra_user');
        return userStr ? JSON.parse(userStr) : null;
    }

    getToken() {
        return localStorage.getItem('hra_token');
    }
}

// Global MSAL service instance (after config is loaded)
setupMSALAuthService();