// MSAL Browser Authentication for HRA Frontend - Thin wrapper
// This file only acts as a wrapper and does NOT load MSAL or create instances
class MSALAuthService {
    constructor() {
        this.msalInstance = null;
        this.account = null;
        // NO initialization here - waits for app.js to call init()
    }

    // Called from app.js when msalInstance is created
    async init(instance) {
        this.msalInstance = instance;
        await this.handleRedirectResponse();
        return true;
    }

    async handleRedirectResponse() {
        if (!this.msalInstance) return;
        try {
            const response = await this.msalInstance.handleRedirectPromise();
            if (response?.account) {
                this.account = response.account;
                this.msalInstance.setActiveAccount(response.account);
                // Optional: exchange token for HRA auth here if you want to handle redirect flow
                // await this.exchangeTokenForHRAAuth(response.accessToken);
            } else {
                const accounts = this.msalInstance.getAllAccounts();
                if (accounts.length > 0) {
                    this.account = accounts[0];
                    this.msalInstance.setActiveAccount(accounts[0]);
                }
            }
        } catch (error) {
            console.error('Error handling redirect:', error);
        }
    }

    // For app.js compatibility
    isUserAuthenticated() {
        const active = this.msalInstance?.getActiveAccount?.();
        return !!active || !!localStorage.getItem('hra_token');
    }

    isAuthenticated() { // kept for backwards compatibility
        return this.isUserAuthenticated();
    }

    async login() {
        if (!this.msalInstance) throw new Error('MSAL not initialized');
        try {
            const loginRequest = {
                scopes: ["User.Read", "openid", "profile", "email"],
                prompt: "select_account"
            };
            const response = await this.msalInstance.loginPopup(loginRequest);
            if (!response?.account) throw new Error('No account in login response');
            this.account = response.account;
            this.msalInstance.setActiveAccount(response.account);
            await this.exchangeTokenForHRAAuth(response.accessToken);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    async exchangeTokenForHRAAuth(accessToken) {
        const res = await fetch('/api/auth/msal-exchange', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ accessToken })
        });
        if (!res.ok) throw new Error('Failed to exchange token');
        const data = await res.json();
        localStorage.setItem('hra_token', data.token);
        localStorage.setItem('hra_user', JSON.stringify(data.user));
        
        // Also set traditional auth format for compatibility
        const authData = {
          t: data.token,
          r: data.user.role,
          n: data.user.name
        };
        localStorage.setItem('auth', JSON.stringify(authData));
        
        window.location.href = '/index.html';
    }

    async logout() {
        try {
            localStorage.removeItem('hra_token');
            localStorage.removeItem('hra_user');
            if (this.msalInstance && this.account) {
                await this.msalInstance.logoutPopup({
                    account: this.account,
                    postLogoutRedirectUri: window.location.origin
                });
            } else {
                window.location.href = '/';
            }
        } catch (e) {
            console.error('Logout failed:', e);
            localStorage.clear();
            window.location.href = '/';
        }
    }

    getCurrentUser() {
        const s = localStorage.getItem('hra_user');
        return s ? JSON.parse(s) : null;
    }

    getToken() {
        return localStorage.getItem('hra_token');
    }
}

// Only create if not already exists (avoid conflicts)
if (!window.msalAuthService) {
    window.msalAuthService = new MSALAuthService();
}