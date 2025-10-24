// MSAL Browser Authentication for HRA Frontend
class MSALAuthService {
  constructor() {
    this.msalInstance = null;
    this.account = null;
  }

  // Kallas från app.js när msalInstance är skapad
  async init(instance) {
    this.msalInstance = instance;
    console.log('🔧 MSALAuthService initialized with MSAL instance');
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
        // (Valfritt) byt token mot HRA här om du vill hantera redirect-flödet
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

  // För app.js kompatibilitet
  isUserAuthenticated() {
    const active = this.msalInstance?.getActiveAccount?.();
    return !!active || !!localStorage.getItem('hra_token');
  }

  isAuthenticated() { // behålls för bakåtkomp
    return this.isUserAuthenticated();
  }

  async login() {
    if (!this.msalInstance) throw new Error('MSAL not initialized');

    const baseScopes = ["openid", "profile", "email", "User.Read"];
    const apiScopes  = (window.API_SCOPES && window.API_SCOPES.length)
      ? window.API_SCOPES
      : ["api://eb9865fe-5d08-43ed-8ee9-6cad32b74981/access"]; // din scope

    try {
      // 1) Interaktiv login (konto-val)
      const loginResponse = await this.msalInstance.loginPopup({
        scopes: baseScopes,
        prompt: "select_account"
      });

      if (!loginResponse?.account) throw new Error('No account in login response');
      this.account = loginResponse.account;
      this.msalInstance.setActiveAccount(loginResponse.account);

      // 2) Försök hämta API-token tyst
      try {
        const apiSilent = await this.msalInstance.acquireTokenSilent({
          scopes: apiScopes,
          account: loginResponse.account
        });
        if (!apiSilent?.accessToken) throw new Error("No API access token (silent)");
        await this.exchangeTokenForHRAAuth(apiSilent.accessToken);
        return;
      } catch (silentErr) {
        // 3) Om samtycke/interaction krävs – kör popup för API-scope
        const codes = (silentErr && (silentErr.errorCode || silentErr.code || '')).toString();
        const needsInteraction =
          codes.includes('interaction_required') ||
          codes.includes('consent_required') ||
          codes.includes('login_required') ||
          codes.includes('no_tokens_found');

        if (!needsInteraction) throw silentErr;

        const apiPopup = await this.msalInstance.acquireTokenPopup({
          scopes: apiScopes
        });
        if (!apiPopup?.accessToken) throw new Error("No API access token (popup)");
        await this.exchangeTokenForHRAAuth(apiPopup.accessToken);
        return;
      }

    } catch (e) {
      // Vanliga MSAL-koder: popup_window_error, user_cancelled, interaction_in_progress, authority_mismatch
      const code = e?.errorCode || e?.code || 'unknown_error';
      const sub  = e?.subError || '';
      const msg  = e?.message || e?.errorMessage || String(e);
      console.error('MSAL Login Failed:', { code, sub, msg });

      // Fallback: om popup blockeras → försök redirect-flöde
      if (code.includes('popup_window_error')) {
        try {
          await this.msalInstance.loginRedirect({ scopes: baseScopes, prompt: "select_account" });
          return; // sidan navigerar
        } catch (e2) {
          console.error('loginRedirect failed:', e2);
        }
      }
      throw new Error(`MSAL Login Failed: ${code}${sub ? ' / '+sub : ''} – ${msg}`);
    }
  }

  async exchangeTokenForHRAAuth(accessToken) {
    console.log('🔄 Exchanging token with backend...');
    console.log('   Token length:', accessToken?.length || 'undefined');
    console.log('   Token preview:', accessToken ? accessToken.substring(0, 50) + '...' : 'no token');
    
    const res = await fetch('/api/auth/msal-exchange', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ accessToken })
    });

    if (!res.ok) {
      let detail;
      try { 
        detail = await res.text(); 
      } catch {}
      throw new Error(`msal-exchange ${res.status}: ${detail || 'Failed to exchange token'}`);
    }

    const data = await res.json();
    console.log('✅ Token exchange successful!');
    
    // Store in same format as traditional login
    localStorage.setItem('hra_token', data.token);
    localStorage.setItem('hra_user', JSON.stringify(data.user));
    
    // Also set traditional auth format for compatibility
    const authData = {
      t: data.token,
      r: data.user.role,
      n: data.user.name
    };
    localStorage.setItem('auth', JSON.stringify(authData));
    
    console.log('🔄 Redirecting to main app...');
    window.location.href = '/index.html';
  }

  async logout() {
    try {
      console.log('🚺 Starting MSAL logout process...');
      
      // Clear local storage first
      localStorage.removeItem('hra_token');
      localStorage.removeItem('hra_user');
      localStorage.removeItem('auth');
      localStorage.removeItem('devBypass');
      localStorage.removeItem('devUser');
      
      // Clear MSAL cache and logout
      if (this.msalInstance) {
        // Clear cache first
        try {
          await this.msalInstance.clearCache();
          console.log('✅ MSAL cache cleared');
        } catch (cacheError) {
          console.warn('⚠️ Cache clear failed:', cacheError);
        }
        
        // Perform logout popup
        if (this.account) {
          await this.msalInstance.logoutPopup({
            account: this.account,
            postLogoutRedirectUri: window.location.origin
          });
          console.log('✅ MSAL popup logout completed');
        } else {
          // Fallback logout without specific account
          await this.msalInstance.logoutPopup({
            postLogoutRedirectUri: window.location.origin
          });
          console.log('✅ MSAL fallback logout completed');
        }
      }
      
      console.log('✅ MSAL logout process completed successfully');
    } catch (e) {
      console.error('⚠️ MSAL Logout failed:', e);
      
      // Even if MSAL logout fails, clear everything locally
      localStorage.clear();
      
      // Force redirect to origin to ensure clean state
      setTimeout(() => {
        window.location.href = window.location.origin;
      }, 100);
      
      throw e;
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

window.msalAuthService = new MSALAuthService();