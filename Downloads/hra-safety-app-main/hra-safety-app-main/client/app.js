// --- MSAL config sanitizer ---
// MSAL config for Azure production
function getMsalConfig() {
  // In production (Azure), always use these values
  if (window.location.hostname.endsWith('azurewebsites.net')) {
    return {
      clientId: 'eb9865fe-5d08-43ed-8ee9-6cad32b74981',
      authority: 'https://login.microsoftonline.com/81fa766e-a349-4867-8bf4-ab35e250a08f',
      redirectUri: 'https://hra-sweden-dafdbdh4h4ghbxgm.swedencentral-01.azurewebsites.net/auth/callback',
      scopes: [
        'openid',
        'profile',
        'email',
        'User.Read',
        'api://eb9865fe-5d08-43ed-8ee9-6cad32b74981/access'
      ],
      cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false
      }
    };
  }
  // For local development, fallback to .env or defaults
  return {
    clientId: msalConfigFallback.clientId,
    authority: `https://login.microsoftonline.com/${msalConfigFallback.tenantId}`,
    redirectUri: window.location.origin + '/auth/callback',
    scopes: [
      'openid',
      'profile',
      'email',
      'User.Read',
      'api://eb9865fe-5d08-43ed-8ee9-6cad32b74981/access'
    ],
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false
    }
  };
}
const API = location.origin;  // same origin
let token=null, role=null, name=null;

const $ = s => document.querySelector(s);
const show = id => { 
  console.log('🎨 Show function called with ID:', id);
  const sections = document.querySelectorAll("main > section");
  console.log('🎨 Found sections:', sections.length);
  sections.forEach(x=>x.classList.add("hidden")); 
  const targetSection = $(id);
  console.log('🎨 Target section:', targetSection);
  if (targetSection) {
    targetSection.classList.remove("hidden");
    console.log('✅ Successfully showed:', id);
  } else {
    console.log('❌ Target section not found:', id);
  }
};

// Define nav and views globally to ensure accessibility
let nav, loginView;
const views = { form:"#formView", mine:"#mineView", dash:"#dashView", users:"#usersView" };

// Initialize navigation event handling
function initNavigation() {
  nav = $("#nav"); 
  loginView = $("#loginView");
  console.log('🎯 Navigation initialized:', {nav: !!nav, loginView: !!loginView});
  
  if (nav) {
    // nav events
    nav.addEventListener("click", e=>{
      console.log('🔄 Nav clicked:', e.target);
      console.log('🔄 Dataset view:', e.target.dataset.view);
      if(e.target.dataset.view){
        const v = e.target.dataset.view;
        console.log('🔄 View to load:', v);
        console.log('🔄 Views object:', views);
        console.log('🔄 Target view ID:', views[v]);
        if(v==="form") {
          console.log('📝 Loading form');
          renderForm();
        }
        if(v==="mine") {
          console.log('📋 Loading mine');
          loadMine();
        }
        if(v==="dash") {
          console.log('📊 Loading dashboard');
          loadDash();
        }
        if(v==="users") {
          console.log('👥 Loading users');
          loadUsers();
        }
        show(views[v]);
        
        // Close mobile menu after navigation (if on mobile)
        if (window.innerWidth <= 768) {
          const mobileToggle = $('#mobileMenuToggle') || $('.mobile-menu-toggle');
          if (mobileToggle) {
            nav.classList.remove('show');
            mobileToggle.classList.remove('active');
          }
        }
      }
    });
    console.log('✅ Navigation event listener attached');
  } else {
    console.log('❌ Navigation element not found');
  }
}

// Mobile menu functionality
function initMobileMenu() {
  const mobileMenuToggle = $('#mobileMenuToggle') || $('.mobile-menu-toggle');
  const navMenu = $('#nav');
  
  if (mobileMenuToggle && navMenu) {
    // Remove any existing listeners to prevent duplicates
    mobileMenuToggle.replaceWith(mobileMenuToggle.cloneNode(true));
    const newToggle = $('#mobileMenuToggle') || $('.mobile-menu-toggle');
    
    newToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navMenu.classList.toggle('show');
      newToggle.classList.toggle('active');
    });

    // Close menu when clicking outside (but don't interfere with nav buttons)
    document.addEventListener('click', (e) => {
      if (!newToggle.contains(e.target) && !navMenu.contains(e.target) && window.innerWidth <= 768) {
        navMenu.classList.remove('show');
        newToggle.classList.remove('active');
      }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        navMenu.classList.remove('show');
        newToggle.classList.remove('active');
      }
    });
  }
}

// Initialize after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM ready, initializing app');
  
  // Initialize navigation references
  nav = $("#nav"); 
  loginView = $("#loginView");
  console.log('🎯 UI references initialized:', {nav: !!nav, loginView: !!loginView});
  
  // Set up navigation event handling
  if (nav) {
    nav.addEventListener("click", e=>{
      console.log('🔄 Nav clicked:', e.target);
      console.log('🔄 Dataset view:', e.target.dataset.view);
      if(e.target.dataset.view){
        const v = e.target.dataset.view;
        console.log('🔄 View to load:', v);
        console.log('🔄 Views object:', views);
        console.log('🔄 Target view ID:', views[v]);
        if(v==="form") {
          console.log('📝 Loading form');
          renderForm();
        }
        if(v==="mine") {
          console.log('📋 Loading mine');
          loadMine();
        }
        if(v==="dash") {
          console.log('📊 Loading dashboard');
          loadDash();
        }
        if(v==="users") {
          console.log('👥 Loading users');
          loadUsers();
        }
        show(views[v]);
        
        // Close mobile menu after navigation (if on mobile)
        if (window.innerWidth <= 768) {
          const mobileToggle = $('#mobileMenuToggle') || $('.mobile-menu-toggle');
          if (mobileToggle) {
            nav.classList.remove('show');
            mobileToggle.classList.remove('active');
          }
        }
      }
    });
    console.log('✅ Navigation event listener attached');
  }
  
  // Load authentication state after nav is ready
  loadAuth();
  
  // Reinitialize event handlers
  const logoutBtn = $("#logout");
  if (logoutBtn) {
    logoutBtn.onclick = async ()=> { 
      console.log('🚪 Logout button clicked');
      
      // Cleanup notifications
      if (window.notificationSystem) {
        window.notificationSystem.cleanup();
        window.notificationSystem = null;
      }
      
      // Clear ALL auth-related localStorage items
      localStorage.removeItem("auth");
      localStorage.removeItem("hra_token");
      localStorage.removeItem("hra_user");
      localStorage.removeItem("devBypass");
      localStorage.removeItem("devUser");
      
      // Clear global auth variables
      token = null;
      role = null;
      name = null;
      window.token = null;
      
      // MSAL logout if available
      if (window.msalInstance && window.msalAuthService) {
        try {
          console.log('🚪 Performing MSAL logout...');
          await window.msalAuthService.logout();
          console.log('✅ MSAL logout completed');
        } catch (error) {
          console.error('⚠️ MSAL logout failed:', error);
          // Continue with regular logout even if MSAL fails
        }
      }
      
      // Clear MSAL cache if instance exists
      if (window.msalInstance) {
        try {
          await window.msalInstance.clearCache();
          console.log('✅ MSAL cache cleared');
        } catch (error) {
          console.warn('⚠️ Could not clear MSAL cache:', error);
        }
      }
      
      console.log('🚪 Auth cleared, reloading page');
      
      // Force page reload to completely reset state
      setTimeout(() => {
        window.location.href = window.location.origin;
      }, 100); 
    };
    console.log('🚪 Logout handler bound');
  }
  
  const loginBtn = $("#loginBtn");
  if (loginBtn) {
    loginBtn.onclick = async ()=>{
      console.log('🔑 Login button clicked');
      $("#loginMsg").classList.add("hidden");
      const body = { username: $("#lu").value.trim(), password: $("#lp").value };
      const res = await fetch(API+"/api/auth/login",{method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const js = await res.json();
      if(!res.ok){ $("#loginMsg").textContent=js.error||"Fel"; $("#loginMsg").classList.remove("hidden"); return; }
      setAuth(js.token, js.role, js.name);
      
      // Initialize notification system on login
      if (!window.notificationSystem) {
        window.notificationSystem = new NotificationSystem();
      }
      
      renderForm(); show(views.form);
    };
    console.log('🔑 Login handler bound');
  }
  
  // Initialize mobile menu
  initMobileMenu();
});

// --- auth ---
function setAuth(t, r, n){
  console.log('🔐 setAuth called:', {token: t?.substring(0,10)+'...', role: r, name: n});
  token=t; role=r; name=n;
  window.token = t; // Make token available globally for image upload
  localStorage.setItem("auth", JSON.stringify({t,r,n}));
  console.log('🔐 Showing navigation menu');
  nav.classList.remove("hidden");
  $(".role-sup").classList.toggle("hidden", !(role==="supervisor"||role==="superintendent"||role==="admin"||role==="arbetsledare"));
  $(".role-admin").classList.toggle("hidden", role!=="admin");
  loginView.classList.add("hidden");
  console.log('🔐 Menu should now be visible');
  
  // Initialize mobile menu after showing nav
  setTimeout(initMobileMenu, 100);
  
  // Automatically show "Ny bedömning" (form view) after login
  setTimeout(() => {
    console.log('🔐 Auto-showing form view after login');
    renderForm();
    show(views.form);
  }, 200);
}
function loadAuth(){
  console.log('🔐 loadAuth called');
  
  // Ensure nav is initialized
  if (!nav) {
    nav = $("#nav");
    loginView = $("#loginView");
  }
  
  const a = JSON.parse(localStorage.getItem("auth")||"null");
  console.log('🔐 Stored auth:', a);
  
  // Check for development bypass first (implementation guide pattern)
  if (localStorage.getItem('devBypass')) {
    console.log('🔧 Development bypass detected, restoring dev session');
    const devUser = JSON.parse(localStorage.getItem('devUser') || '{}');
    setAuth('dev-mock-token', 'admin', devUser.name || 'Development User');
    return;
  }
  
  if(!a) {
    console.log('🔐 No stored auth found, checking for MSAL session...');
    
    // Check for MSAL tokens and convert to traditional auth format
    const hraToken = localStorage.getItem('hra_token');
    const hraUser = localStorage.getItem('hra_user');
    
    if (hraToken && hraUser) {
      console.log('🔐 Found MSAL session, converting to traditional format');
      try {
        const userData = JSON.parse(hraUser);
        const authData = {
          t: hraToken,
          r: userData.role,
          n: userData.name
        };
        localStorage.setItem('auth', JSON.stringify(authData));
        
        // Set auth variables
        token = hraToken;
        role = userData.role;
        name = userData.name;
        window.token = hraToken;
        
        // Show navigation and hide login
        if (nav) {
          nav.classList.remove("hidden");
          console.log('🔐 Navigation menu shown');
        }
        
        $(".role-sup").classList.toggle("hidden", !(role==="supervisor"||role==="superintendent"||role==="admin"||role==="arbetsledare"));
        $(".role-admin").classList.toggle("hidden", role!=="admin");
        
        if (loginView) {
          loginView.classList.add("hidden");
        }
        
        // Initialize notification system
        if (!window.notificationSystem) {
          window.notificationSystem = new NotificationSystem();
        }
        
        // Initialize mobile menu
        setTimeout(initMobileMenu, 100);
        
        // Show form view (Ny bedömning) as default
        setTimeout(() => {
          renderForm();
          show(views.form);
        }, 200);
        
        return;
      } catch (error) {
        console.error('⚠️ Error parsing MSAL user data:', error);
      }
    }
    
    // Check if MSAL auth service is available and has authenticated user
    setTimeout(() => {
      if (window.msalAuthService && window.msalAuthService.isUserAuthenticated()) {
        console.log('🔐 Found MSAL authenticated session');
        // Will be handled by MSAL service initialization
      }
    }, 100);
    return;
  }
  
  token=a.t; role=a.r; name=a.n;
  window.token = a.t; // Make token available globally for image upload
  console.log('🔐 Loaded traditional auth:', {role, name});
  
  if (nav) {
    nav.classList.remove("hidden");
    console.log('🔐 Navigation menu shown');
  }
  
  $(".role-sup").classList.toggle("hidden", !(role==="supervisor"||role==="superintendent"||role==="admin"||role==="arbetsledare"));
  $(".role-admin").classList.toggle("hidden", role!=="admin");
  
  if (loginView) {
    loginView.classList.add("hidden");
  }
  
  console.log('🔐 Auth loaded, menu should be visible');
  
  // Initialize notification system for logged in users
  if (!window.notificationSystem) {
    window.notificationSystem = new NotificationSystem();
  }
  
  // Initialize mobile menu after showing nav
  setTimeout(initMobileMenu, 100);
  
  // Show form view (Ny bedömning) as default for traditional auth too
  setTimeout(() => {
    console.log('🔐 Auto-showing form view after traditional auth load');
    renderForm();
    show(views.form);
  }, 200);
}

// MSAL Authentication
let msalConfig = null;

// Fallback som används om msal-config inte går att hämta
// API scopes för HRA backend authentication (globalt tillgänglig)
const API_SCOPES = ["api://eb9865fe-5d08-43ed-8ee9-6cad32b74981/access"];
window.API_SCOPES = API_SCOPES;

// Flattened fail-safe configuration if backend config fetch fails
const msalConfigFallback = {
  clientId: "eb9865fe-5d08-43ed-8ee9-6cad32b74981",
  tenantId: "81fa766e-a349-4867-8bf4-ab35e250a08f",
  authority: "https://login.microsoftonline.com/81fa766e-a349-4867-8bf4-ab35e250a08f",
  redirectUri: window.location.origin + "/auth/callback",
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  }
};

// Load MSAL configuration
async function loadMSALConfig() {
  const fb = {
    clientId: "eb9865fe-5d08-43ed-8ee9-6cad32b74981",
    tenantId: "81fa766e-a349-4867-8bf4-ab35e250a08f",
    redirectUri: window.location.origin + "/auth/callback",
    cache: { cacheLocation: "sessionStorage", storeAuthStateInCookie: false }
  };

  try {
    const r = await fetch(API + "/api/auth/msal-config");
    msalConfig = r.ok ? await r.json() : {};
  } catch { msalConfig = {}; }

  // Merge + fix
  msalConfig.clientId  = msalConfig.clientId || fb.clientId;
  msalConfig.tenantId  = msalConfig.tenantId || fb.tenantId;

  // ALWAYS derive from tenantId to avoid /undefined/
  msalConfig.authority = `https://login.microsoftonline.com/${msalConfig.tenantId}`;

  // Ensure https + /auth/callback
  const ru = msalConfig.redirectUri || fb.redirectUri;
  const origin = window.location.origin.replace(/^http:/, 'https:');
  msalConfig.redirectUri = ru.startsWith('http')
    ? ru.replace(/^http:/, 'https:')
    : origin + "/auth/callback";

  msalConfig.cache = msalConfig.cache || fb.cache;
  console.log("MSAL Config (final):", msalConfig);
  return true;
}

// MSAL Login Button - With direct popup fallback and diagnostics
$("#msalLoginBtn").onclick = async () => {
  try {
    $("#loginMsg").classList.add("hidden");

    if (!(window.msalInstance && window.msalAuthService)) {
      await bootMsal();
    }

    if (window.msalAuthService?.login) {
      await window.msalAuthService.login(); // normal väg
      return;
    }


    // 🔁 Fallback: kör direkt popup om service saknas/inte redo
    const instance = window.msalInstance;
    if (!instance) throw new Error("MSAL instance missing after boot");

    // 1) Först logga in för användarinfo
    const loginResponse = await instance.loginPopup({
      scopes: ["openid", "profile", "email", "User.Read"],
      prompt: "select_account"
    });
    if (!loginResponse?.account) throw new Error("No account from login");
    instance.setActiveAccount(loginResponse.account);

    // 2) Hämta API-token för backend (alltid separat steg)
    // Ensure API_SCOPES is used for acquiring tokens
    const apiScopes = window.API_SCOPES || ["api://eb9865fe-5d08-43ed-8ee9-6cad32b74981/access"];
    let apiTokenResponse;
    try {
      apiTokenResponse = await instance.acquireTokenSilent({
        scopes: apiScopes,
        account: loginResponse.account
      });
    } catch (_) {
      apiTokenResponse = await instance.acquireTokenPopup({ scopes: apiScopes });
    }
    if (!apiTokenResponse?.accessToken) throw new Error("Failed to get API token");

    // Pass the access token to /api/auth/msal-exchange
    console.log('✅ Got API token, exchanging with backend...');
    const exRes = await fetch(API + "/api/auth/msal-exchange", {
      method: "POST",
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ accessToken: apiTokenResponse.accessToken })
    });
    const exJson = await exRes.json();
    if (!exRes.ok) throw new Error(exJson.error || "Token exchange failed");

    setAuth(exJson.token, exJson.user.role, exJson.user.name);
    renderForm(); show(views.form);

  } catch (error) {
    console.error("❌ MSAL login error:", error);
    console.error("   Error type:", error.constructor.name);
    console.error("   Error message:", error.message);
    console.error("   MSAL diagnostics:", window.__MSAL_DIAG);
    
    const diag = Array.isArray(window.__MSAL_DIAG) ? window.__MSAL_DIAG.join(" → ") : "no-diag";
    
    // Mer specifik felhantering baserat på den nya robusta koden
    let userMessage = "Microsoft-inloggning misslyckades";
    let technicalInfo = error.message;
    
    // Hantera MSAL-specifika felkoder
    if (error.message.includes('MSAL Login Failed:')) {
      // Plocka ut felkoden från det robusta systemet
      const match = error.message.match(/MSAL Login Failed: (\w+)/);
      const errorCode = match ? match[1] : 'unknown_error';
      
      switch (errorCode) {
        case 'interaction_required':
        case 'consent_required':
          userMessage = "Samtycke krävs för Microsoft-inloggning";
          technicalInfo = "Du behöver ge samtycke för att komma åt HRA-systemet. Försök igen.";
          break;
        case 'popup_window_error':
          userMessage = "Popup blockeras av webbläsaren";
          technicalInfo = "Tillåt popups för denna sida eller försök igen.";
          break;
        case 'user_cancelled':
          userMessage = "Inloggning avbröts";
          technicalInfo = "Du avbröt Microsoft-inloggningen.";
          break;
        case 'authority_mismatch':
          userMessage = "Fel Microsoft-konto";
          technicalInfo = "Du måste logga in med ett Volvo Cars-konto.";
          break;
        default:
          userMessage = "Microsoft-inloggning misslyckades";
          technicalInfo = `MSAL fel: ${errorCode} - ${error.message}`;
      }
    } else if (error.message.includes('msal-exchange')) {
      userMessage = "Inloggning misslyckades";
      technicalInfo = `Backend-fel: ${error.message}`;
    } else if (error.message.includes('Failed to acquire API token')) {
      userMessage = "Kunde inte hämta behörighetstoken";
      technicalInfo = "Kontrollera att din användare har rätt behörigheter.";
    } else if (error.message.includes('No account')) {
      userMessage = "Inloggning avbröts eller misslyckades";
      technicalInfo = "Ingen användare vald eller inloggning avbröts.";
    }
    
    $("#loginMsg").innerHTML = `
      <strong>${userMessage}</strong><br>
      <small>Teknisk information: ${technicalInfo}<br>Diag: ${diag}</small>
    `;
    $("#loginMsg").classList.remove("hidden");
  }
};

// Development bypass function (from implementation guide)
function skipMSALLogin() {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🔧 Development bypass: Skipping MSAL login');
    
    // Create mock user following guide pattern
    const devMockUser = {
      username: 'dev@volvo.com',
      name: 'Development User',
      homeAccountId: 'dev-mock-account',
      localAccountId: 'dev-local-account',
      environment: 'login.microsoftonline.com'
    };
    
    localStorage.setItem('devBypass', 'true');
    localStorage.setItem('devUser', JSON.stringify(devMockUser));
    
    // Simulate successful login
    setAuth('dev-mock-token', 'admin', 'Development User');
    renderForm();
    show(views.form);
    
    $("#loginMsg").innerHTML = `
      <strong>Development Mode Active</strong><br>
      <small>Logged in as ${devMockUser.name}</small>
    `;
    $("#loginMsg").classList.remove("hidden");
    
    return true;
  }
  return false;
}

// Update Microsoft login button status based on availability
function updateMicrosoftLoginStatus(available, message = '') {
  const msalBtn = $("#msalLoginBtn");
  const networkStatus = $("#networkStatus");
  const networkStatusText = $("#networkStatusText");
  
  if (available) {
    msalBtn.disabled = false;
    msalBtn.style.opacity = '1';
    msalBtn.style.cursor = 'pointer';
    networkStatusText.textContent = message || 'Microsoft-inloggning tillgänglig';
    networkStatus.className = 'network-status success';
    networkStatus.classList.remove('hidden');
  } else {
    msalBtn.disabled = true;
    msalBtn.style.opacity = '0.6';
    msalBtn.style.cursor = 'not-allowed';
    networkStatusText.textContent = message || 'Microsoft-inloggning inte tillgänglig';
    networkStatus.className = 'network-status error';
    networkStatus.classList.remove('hidden');
  }
}

// === HJÄLPFUNKTIONER FÖR MANUELL TESTNING I KONSOLEN ===

// Test API token acquisition
window.testAPIToken = async () => {
  try {
    const acc = window.msalInstance?.getActiveAccount();
    if (!acc) {
      console.log('❌ Ingen aktiv account. Logga in först.');
      return;
    }
    
    console.log('✅ Aktiv account:', acc.username);
    
    console.log('🔄 Försöker hämta API-token med scopes:', window.API_SCOPES);
    
    const result = await window.msalInstance.acquireTokenSilent({
      scopes: window.API_SCOPES,
      account: acc
    });
    
    console.log('✅ API Token acquired!');
    console.log('📋 Token audience:', JSON.parse(atob(result.accessToken.split('.')[1])).aud);
    console.log('📏 Token length:', result.accessToken.length);
    
    return result.accessToken;
  } catch (error) {
    console.error('❌ API Token error:', error);
    return null;
  }
};

// Test backend token exchange
window.testTokenExchange = async (token) => {
  try {
    if (!token) {
      token = await window.testAPIToken();
      if (!token) return;
    }
    
    console.log('🔄 Testing token exchange...');
    const response = await fetch('/api/auth/msal-exchange', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ accessToken: token })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Token exchange successful!', data);
    } else {
      const error = await response.text();
      console.error('❌ Token exchange failed:', error);
    }
  } catch (error) {
    console.error('❌ Exchange error:', error);
  }
};

// Enkel manuell login-test för felsökning
window.testLogin = async () => {
  console.log('🚀 === MANUAL LOGIN TEST ===');
  
  try {
    if (!window.msalAuthService) {
      console.error('❌ No msalAuthService');
      return;
    }
    
    console.log('📋 Starting login...');
    await window.msalAuthService.login();
    console.log('✅ Login completed successfully!');
    
  } catch (error) {
    console.error('❌ Login test failed:');
    console.error('   Error type:', error.constructor.name);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    
    // Om det är ett MSAL-fel, visa mer detaljer
    if (error.errorCode || error.code) {
      console.error('   MSAL error code:', error.errorCode || error.code);
      console.error('   MSAL sub error:', error.subError || 'none');
    }
    
    return { error: error.message, type: error.constructor.name };
  }
};

// 60-sekunders DevTools checklista
window.quickCheck = async () => {
  console.log('⚡ === 60-SEKUNDERS DEVTOOLS CHECKLISTA ===');
  
  try {
    // 1. Kontrollera API_SCOPES
    console.log('\n📋 1. API Scopes:');
    console.log('   window.API_SCOPES:', window.API_SCOPES);
    console.log('   Expected: ["api://eb9865fe-5d08-43ed-8ee9-6cad32b74981/access"]');
    
    if (!window.msalInstance) {
      console.error('❌ No MSAL instance');
      return { error: 'No MSAL instance' };
    }
    
    // Kontrollera att MSAL är initialiserad
    if (!window.msalInstance._initialized) {
      console.error('❌ MSAL not initialized - try bootMsal() first');
      return { error: 'MSAL not initialized' };
    }
    
    // 2. Kontrollera aktiv account
    const acc = window.msalInstance.getActiveAccount();
    if (!acc) {
      console.error('❌ No active account - login required');
      return { error: 'No active account' };
    }
    console.log('✅ Active account:', acc.username);
    
    // 3. Testa acquireTokenSilent
    console.log('\n🎫 2. Testing acquireTokenSilent:');
    const t = await window.msalInstance.acquireTokenSilent({ 
      scopes: window.API_SCOPES, 
      account: acc 
    }).catch(e => e);
    
    if (t.accessToken) {
      console.log('✅ Token acquired successfully');
      
      // 4. Kontrollera token claims
      console.log('\n🔍 3. Token Claims:');
      const c = JSON.parse(atob(t.accessToken.split('.')[1]));
      const claims = {
        aud: c.aud,
        scp: c.scp,
        iss: c.iss,
        tid: c.tid
      };
      console.log('   Actual:', claims);
      console.log('   Expected:');
      console.log('     aud: "api://eb9865fe-5d08-43ed-8ee9-6cad32b74981"');
      console.log('     scp: contains "access"');
      console.log('     tid: "81fa766e-a349-4867-8bf4-ab35e250a08f"');
      console.log('     iss: "https://login.microsoftonline.com/81fa766e-a349-4867-8bf4-ab35e250a08f/v2.0"');
      
      return { success: true, claims, token: 'acquired' };
    } else {
      const errorCode = t.errorCode || t.code || t.message || t;
      console.log('❌ Token acquisition failed:', errorCode);
      console.log('   Common codes: interaction_required, consent_required, login_required, no_tokens_found');
      return { error: errorCode, needsInteraction: true };
    }
    
  } catch (error) {
    console.error('❌ Quick check failed:', error);
    return { error: error.message };
  }
};

// Step-by-step diagnostics following the troubleshooting guide
window.stepByStepDiag = async () => {
  console.log('🚀 === STEP-BY-STEP MSAL DIAGNOSTICS ===');
  
  try {
    // Step 1: Check API_SCOPES
    console.log('\n🔍 Step 1: Checking API Scopes');
    console.log('   window.API_SCOPES:', window.API_SCOPES);
    console.log('   Expected: ["api://eb9865fe-5d08-43ed-8ee9-6cad32b74981/access"]');
    
    if (!window.msalInstance) {
      console.error('❌ No MSAL instance - need to boot first');
      return;
    }
    
    const acc = window.msalInstance.getActiveAccount();
    if (!acc) {
      console.error('❌ No active account - need to login first');
      return;
    }
    
    console.log('✅ Active account:', acc.username);
    
    // Step 2: Get token and check claims
    console.log('\n🎫 Step 2: Acquiring token and checking claims');
    const r = await window.msalInstance.acquireTokenSilent({ 
      scopes: window.API_SCOPES, 
      account: acc 
    });
    
    const claims = JSON.parse(atob(r.accessToken.split('.')[1]));
    const result = {
      aud: claims.aud,
      scp: claims.scp,
      iss: claims.iss,
      tid: claims.tid
    };
    
    console.log('📋 Token claims:', result);
    console.log('\n✅ Expected values:');
    console.log('   aud: "api://eb9865fe-5d08-43ed-8ee9-6cad32b74981"');
    console.log('   scp: should include "access"');
    console.log('   tid: "81fa766e-a349-4867-8bf4-ab35e250a08f"');
    console.log('   iss: "https://login.microsoftonline.com/81fa766e-a349-4867-8bf4-ab35e250a08f/v2.0"');
    
    // Step 3: Test exchange endpoint manually
    console.log('\n🔄 Step 3: Testing exchange endpoint manually');
    const ex = await fetch('/api/auth/msal-exchange', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ accessToken: r.accessToken })
    });
    
    console.log('📡 Exchange response status:', ex.status);
    const body = await ex.text();
    console.log('📄 Exchange response body:', body);
    
    if (ex.ok) {
      console.log('✅ Exchange successful!');
    } else {
      console.error('❌ Exchange failed - check server logs for details');
    }
    
    return { claims: result, exchangeStatus: ex.status, exchangeBody: body };
    
  } catch (error) {
    console.error('❌ Step-by-step diagnostics failed:', error);
    return { error: error.message };
  }
};

// Quick diagnostics
window.msalDiag = () => {
  console.log('🔍 MSAL Instance:', !!window.msalInstance);
  console.log('🔍 MSAL Config:', window.msalConfig);
  console.log('🔍 Active Account:', window.msalInstance?.getActiveAccount?.()?.username || 'None');
  console.log('🔍 MSAL Diagnostics:', window.__MSAL_DIAG);
  console.log('🔍 API Scopes:', window.API_SCOPES);
};

// Manuell login-test med full loggning
window.testManualLogin = async () => {
  try {
    console.log('🚀 Starting manual login test...');
    
    if (!window.msalInstance) {
      console.error('❌ No MSAL instance');
      return;
    }
    
    // Steg 1: Login popup
    console.log('🔑 Step 1: Login popup...');
    const loginResponse = await window.msalInstance.loginPopup({
      scopes: ["openid", "profile", "email", "User.Read"],
      prompt: "select_account"
    });
    console.log('✅ Login successful:', loginResponse.account.username);
    
    // Steg 2: Sätt aktiv account
    window.msalInstance.setActiveAccount(loginResponse.account);
    console.log('✅ Active account set');
    
    // Steg 3: Få API token
    console.log('🎫 Step 3: Acquiring API token with scopes:', window.API_SCOPES);
    const apiTokenResponse = await window.msalInstance.acquireTokenSilent({
      scopes: window.API_SCOPES,
      account: loginResponse.account
    });
    console.log('✅ API Token acquired, length:', apiTokenResponse.accessToken.length);
    
    // Steg 4: Kontrollera token claims
    const tokenPayload = JSON.parse(atob(apiTokenResponse.accessToken.split('.')[1]));
    console.log('📋 Token claims:');
    console.log('   aud (audience):', tokenPayload.aud);
    console.log('   scp (scopes):', tokenPayload.scp);
    console.log('   iss (issuer):', tokenPayload.iss);
    console.log('   sub (subject):', tokenPayload.sub);
    
    // Steg 5: Testa backend exchange
    console.log('🔄 Step 5: Testing backend exchange...');
    const response = await fetch('/api/auth/msal-exchange', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ accessToken: apiTokenResponse.accessToken })
    });
    
    console.log('📡 Backend response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Exchange successful!', data);
    } else {
      const error = await response.text();
      console.error('❌ Exchange failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Manual test failed:', error);
  }
};

// Test network connectivity to CDN sources
async function testNetworkConnectivity() {
  const testUrls = [
    'https://alcdn.msauth.net',
    'https://cdn.jsdelivr.net', 
    'https://unpkg.com'
  ];
  
  const results = [];
  
  for (const url of testUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch(url + '/favicon.ico', { 
        method: 'HEAD', 
        signal: controller.signal,
        mode: 'no-cors' 
      });
      
      clearTimeout(timeoutId);
      results.push({ url, status: 'accessible' });
      console.log('✅ CDN accessible:', url);
    } catch (error) {
      results.push({ url, status: 'blocked', error: error.message });
      console.log('❌ CDN blocked:', url, error.message);
    }
  }
  
  return results;
}

// Safe MSAL LogLevel access function (prevents race condition errors)
function getMsalLogLevelSafe() {
  try {
    if (typeof msal !== 'undefined' && msal.LogLevel && typeof msal.LogLevel.Info !== 'undefined') {
      return msal.LogLevel.Info;
    }
  } catch(_) {
    // Ignore any access errors
  }
  return 2; // numeric fallback ~ Info level
}

// Load MSAL library dynamically with fallback CDNs
function loadMSALScript() {
  return new Promise((resolve, reject) => {
    if (typeof msal !== 'undefined' && typeof msal.PublicClientApplication === 'function') return resolve();

    const cdnUrls = [
      `${location.origin}/lib/msal-browser.min.js`, // lokal kopia
      'https://alcdn.msauth.net/browser/3.0.0/js/msal-browser.min.js',
      'https://cdn.jsdelivr.net/npm/@azure/msal-browser@3.0.0/lib/msal-browser.min.js',
      'https://unpkg.com/@azure/msal-browser@3.0.0/lib/msal-browser.min.js'
    ];

    let i = 0;
    const tryNext = () => {
      if (i >= cdnUrls.length) return reject(new Error('Failed to load MSAL script'));
      const s = document.createElement('script');
      s.src = cdnUrls[i++];
      s.async = true;
      const to = setTimeout(() => { s.remove(); tryNext(); }, 10000);
      s.onload = () => { clearTimeout(to); return resolve(); };
      s.onerror = () => { clearTimeout(to); tryNext(); };
      document.head.appendChild(s);
    };
    tryNext();
  });
}

// Central MSAL boot function with detailed diagnostics
async function bootMsal() {
  const diag = [];
  try {
    // 1) Konfig
    diag.push("loadMSALConfig:start");
    if (!msalConfig && !(await loadMSALConfig())) {
      throw new Error('Missing MSAL config');
    }
    diag.push("loadMSALConfig:ok");

    // 2) Script
    diag.push("loadMSALScript:start");
    await loadMSALScript();
    diag.push("loadMSALScript:ok");

    // 3) Verifiera global MSAL
    if (!(window.msal && typeof msal.PublicClientApplication === 'function')) {
      throw new Error('MSAL not present after script load (CSP/CDN?)');
    }
    diag.push("msalPresent:ok");

    // 4) Skapa instans
    msalConfig = getMsalConfig();
    console.log('MSAL (final) config:', msalConfig);
    const msalInstance = new msal.PublicClientApplication({
      auth: {
        clientId: msalConfig.clientId,
        authority: msalConfig.authority,
        redirectUri: msalConfig.redirectUri,
        postLogoutRedirectUri: msalConfig.redirectUri,
        navigateToLoginRequestUrl: false
      },
      cache: msalConfig.cache,
      system: {
        allowNativeBroker: false,
        loggerOptions: {
          loggerCallback: (level, message, containsPii) => {
            if (containsPii) return;
            const LL = (typeof msal !== 'undefined' && msal.LogLevel) ? msal.LogLevel : {};
            switch (level) {
              case LL?.Error:   console.error(`[MSAL]: ${message}`); break;
              case LL?.Warning: console.warn(`[MSAL]: ${message}`);  break;
              case LL?.Info:    console.info(`[MSAL]: ${message}`);  break;
              case LL?.Verbose: console.debug(`[MSAL]: ${message}`); break;
              default:          console.log(`[MSAL-${level}]: ${message}`);
            }
          },
          logLevel: getMsalLogLevelSafe(),
          piiLoggingEnabled: false
        }
      }
    });
    window.msalInstance = msalInstance;
    diag.push("instance:ok");

    // CRITICAL: Initialize the instance (required in MSAL 3.0.0+)
    await msalInstance.initialize();
    diag.push("initialize:ok");

    // 5) Låt tjänsten ta över om den finns
    if (window.msalAuthService?.init) {
      await window.msalAuthService.init(msalInstance);
      diag.push("service.init:ok");
    } else {
      diag.push("service.init:skipped");
    }

    console.log('✅ MSAL booted successfully', diag);
    window.__MSAL_DIAG = diag;
    return true;

  } catch (error) {
    console.log('⚠️ MSAL boot failed:', error.message, diag);
    window.__MSAL_DIAG = diag;
    throw error;
  }
}

// Initialize MSAL configuration on page load
loadMSALConfig();

// Kör vid DOMContentLoaded (tidigt) för att boota MSAL
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await bootMsal();
    console.log('✅ MSAL booted on page load');
  } catch (e) {
    console.log('⚠️ MSAL boot failed on page load:', e.message);
  }
  
  // Show development bypass button on localhost (following implementation guide)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const devBypassBtn = $("#devBypassBtn");
    if (devBypassBtn) {
      devBypassBtn.classList.remove('hidden');
      console.log('🔧 Development environment detected - showing bypass button');
    }
  }
  
  // Test Microsoft login availability and show status
  setTimeout(async () => {
    console.log('🔍 Testing Microsoft login availability...');
    
    // Test MSAL configuration availability
    const configAvailable = msalConfig || await loadMSALConfig();
    
    if (!configAvailable) {
      updateMicrosoftLoginStatus(false, 'Microsoft-konfiguration saknas');
      return;
    }
    
    // Test network connectivity
    const networkStatus = await testNetworkConnectivity();
    const accessibleCDNs = networkStatus.filter(r => r.status === 'accessible').length;
    
    if (accessibleCDNs === 0) {
      updateMicrosoftLoginStatus(false, 'Nätverket blockerar Microsoft-tjänster');
    } else if (accessibleCDNs < networkStatus.length) {
      updateMicrosoftLoginStatus(true, `Begränsad Microsoft-inloggning (${accessibleCDNs}/${networkStatus.length} CDN:er tillgängliga)`);
    } else {
      updateMicrosoftLoginStatus(true, 'Microsoft-inloggning tillgänglig');
    }
    
    // Also update the general network status display
    updateNetworkStatusDisplay(networkStatus);
  }, 1000);
});

// Update network status display
function updateNetworkStatusDisplay(networkResults) {
  const networkStatusDiv = $("#networkStatus");
  const networkStatusText = $("#networkStatusText");
  const testUserHints = $("#testUserHints");
  
  if (!networkStatusDiv || !networkStatusText) return;
  
  const accessibleCDNs = networkResults.filter(r => r.status === 'accessible').length;
  const totalCDNs = networkResults.length;
  
  networkStatusDiv.classList.remove('hidden');
  
  if (accessibleCDNs === 0) {
    networkStatusDiv.className = 'network-status blocked';
    networkStatusText.textContent = 'Microsoft-inloggning blockerad (alla CDN:er otillgängliga)';
    
    // Show test user hints when MSAL is blocked
    if (testUserHints) {
      testUserHints.classList.remove('hidden');
    }
  } else if (accessibleCDNs < totalCDNs) {
    networkStatusDiv.className = 'network-status';
    networkStatusText.textContent = `Begränsad Microsoft-inloggning (${accessibleCDNs}/${totalCDNs} CDN:er tillgängliga)`;
    
    // Hide test user hints when some MSAL access is available
    if (testUserHints) {
      testUserHints.classList.add('hidden');
    }
  } else {
    networkStatusDiv.className = 'network-status accessible';
    networkStatusText.textContent = 'Microsoft-inloggning tillgänglig';
    
    // Hide test user hints when MSAL is fully available
    if (testUserHints) {
      testUserHints.classList.add('hidden');
    }
  }
}

// --- FORM (återanvänder logiken från MVP: risk & checklist) ---
function formHTML(){
  return `
  <h2>Ny riskbedömning</h2>
  <div class="grid2">
    <label>Datum<input type="date" id="f_datum"></label>
    <label>Namn<input id="f_namn" value="${name||''}"></label>
    <label>Team<input id="f_team"></label>
    <label>Plats<input id="f_plats"></label>
  </div>
  <label>Arbetsuppgift<input id="f_task" placeholder="Kort beskrivning"></label>

  <div class="grid3" style="margin-top:8px">
    <label>Sannolikhet (1–5)<input type="number" id="f_s" min="1" max="5" value="1"></label>
    <label>Konsekvens (1–5)<input type="number" id="f_k" min="1" max="5" value="1"></label>
    <label>Riskpoäng<input id="f_r" readonly></label>
  </div>
  <label>Identifierade risker<textarea id="f_risks" rows="3"></textarea></label>

  <h3>Checklista</h3>
  <div id="f_list"></div>
  <p id="f_warn" class="warn hidden">Minst ett svar är Nej – kräver arbetsledarens godkännande.</p>

  <h3>Åtgärder</h3>
  <textarea id="f_actions" rows="3" placeholder="Spärra av, LOTO, skyltning, fallskydd, mät/ventilera ..."></textarea>

  <h3>Bilder och Dokumentation</h3>
  <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem;">
    Ladda upp bilder av arbetsmiljön, utrustning eller andra relevanta förhållanden för bedömningen.
  </p>
  ${window.imageUploadManager ? window.imageUploadManager.createImageUploadHTML() : '<div>Bilduppladdning laddas...</div>'}

  <div class="grid2">
    <label>Behövs ytterligare åtgärder?
      <select id="f_further"><option>Nej</option><option>Ja</option></select>
    </label>
    <label>Behövs full riskanalys framåt?
      <select id="f_fullrisk"><option>Nej</option><option>Ja</option></select>
    </label>
  </div>

  <h3>Godkännande</h3>
  <div class="grid1">
    <label>Kan arbetet utföras säkert?
      <select id="f_safe"><option>Ja</option><option>Nej</option></select>
    </label>
  </div>

  <div style="margin-top:10px">
    <button id="f_submit">Skicka</button>
    <span id="f_msg"></span>
  </div>
  `;
}
function renderForm(){
  $("#formView").innerHTML = formHTML();
  const list = $("#f_list");
  const Q = [
    "Risker/resternergier bedömda (Safety Placard som stöd)?",
    "Fallrisker eliminerade?",
    "Kläm-/skär-/kraftrisker hanterade?",
    "Rätt verktyg/PPE tillgängligt?",
    "Tillstånd/behörighet (heta arbeten/slutna utrymmen) klart?",
    "Snubbel/olja/lösa föremål undanröjda?",
    "Avspärrningar/kommunikation/skyltning klar?",
    "Utrustning i gott skick för lyft/lastsäkring?",
    "Nödvändig utrustning kontrollerad före användning?",
    "Känt var nödstopp/utrymning/ögondusch finns?"
  ];
  Q.forEach((q,i)=>{
    const row=document.createElement("div"); row.className="grid3";
    row.innerHTML=`<label style="grid-column:1/3">${q}</label>
      <label><select id="q${i}"><option></option><option>Ja</option><option>Nej</option></select></label>`;
    list.appendChild(row);
  });
  const calc=()=>{ const s=+$("#f_s").value||1, k=+$("#f_k").value||1, r=s*k; $("#f_r").value=r;
    const anyNej = Q.some((_,i)=>($("#q"+i).value==="Nej")); $("#f_warn").classList.toggle("hidden",!anyNej);
  };
  ["f_s","f_k"].forEach(id=>$("#"+id).addEventListener("input",calc));
  list.addEventListener("change",calc); calc();

  $("#f_submit").onclick = async ()=>{
    try {
      console.log('📝 Form submission started...');
      
      // Get fresh token before submission
      const freshToken = await getFreshToken();
      console.log('🎩 Using fresh token for submission');
      
      const checklist = Q.map((_,i)=>$("#q"+i).value||"");
      
      // Get uploaded images if image upload manager is available
      const uploadedImages = window.imageUploadManager ? window.imageUploadManager.getUploadedImages() : [];
      
      const body = {
        date: $("#f_datum").value,
        worker_name: $("#f_namn").value,
        team: $("#f_team").value,
        location: $("#f_plats").value,
        task: $("#f_task").value,
        risk_s: +$("#f_s").value, risk_k: +$("#f_k").value,
        risks: $("#f_risks").value, checklist,
        actions: $("#f_actions").value,
        further: $("#f_further").value, fullrisk: $("#f_fullrisk").value,
        safe: $("#f_safe").value,
        images: uploadedImages.map(img => ({
          name: img.name,
          size: img.size,
          type: img.type,
          url: img.url
        }))
      };
      
      console.log('📦 Sending data:', body);
      console.log('🔗 API URL:', API + "/api/assessments");
      
      const res = await fetch(API+"/api/assessments",{method:"POST",
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+freshToken},
        body: JSON.stringify(body)});
        
      console.log('📡 Response status:', res.status, res.statusText);
      
      const js = await res.json();
      console.log('📄 Response data:', js);
      
      const msg=$("#f_msg");
      if(!res.ok){ 
        console.error('❌ Server error:', js.error);
        msg.className="warn"; 
        msg.textContent=js.error||"Fel"; 
        alert('Fel vid skickande: ' + (js.error || 'Okänt fel'));
        return; 
      }
      
      msg.className="ok"; msg.textContent=`Skickad. ID ${js.id}, risk=${js.riskScore}`;
      
      // Clear uploaded images after successful submission
      if (window.imageUploadManager) {
        window.imageUploadManager.clearImages();
      }
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification('Riskbedömning skickad framgångsrikt! 🎉', 'success');
      }
      
      console.log('✅ Form submitted successfully!');
      
    } catch (error) {
      console.error('💥 Form submission error:', error);
      const msg=$("#f_msg");
      
      if (error.message.includes('No valid token')) {
        msg.className="warn"; 
        msg.textContent="Session har gått ut - logga in igen";
        alert('Din session har gått ut. Vänligen logga in igen.');
        // Redirect to login
        setTimeout(() => {
          localStorage.clear();
          location.reload();
        }, 2000);
      } else {
        msg.className="warn"; 
        msg.textContent="Nätverksfel eller serverfel";
        alert('Fel vid skickande: ' + error.message);
      }
    }
  };
}

// Get fresh token for API requests
async function getFreshToken() {
  // First try to use existing HRA token
  const hraToken = localStorage.getItem('hra_token');
  if (hraToken && token === hraToken) {
    return token; // Use existing token if it's the same
  }
  
  // If MSAL is available, try to get fresh token
  if (window.msalInstance && window.msalAuthService) {
    try {
      const account = window.msalInstance.getActiveAccount();
      if (account && window.API_SCOPES) {
        console.log('🔄 Getting fresh token from MSAL...');
        const tokenResponse = await window.msalInstance.acquireTokenSilent({
          scopes: window.API_SCOPES,
          account: account
        });
        
        if (tokenResponse?.accessToken) {
          // Exchange for HRA token
          const res = await fetch('/api/auth/msal-exchange', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ accessToken: tokenResponse.accessToken })
          });
          
          if (res.ok) {
            const data = await res.json();
            localStorage.setItem('hra_token', data.token);
            localStorage.setItem('hra_user', JSON.stringify(data.user));
            
            // Update global token
            token = data.token;
            window.token = data.token;
            console.log('✅ Fresh token acquired and exchanged');
            return data.token;
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to get fresh MSAL token:', error);
    }
  }
  
  // Fallback to existing token or HRA token
  if (token) return token;
  if (hraToken) {
    token = hraToken;
    window.token = hraToken;
    return hraToken;
  }
  
  throw new Error('No valid token available - please login again');
}

// Make getFreshToken available globally
window.getFreshToken = getFreshToken;

// Global logout function for emergency use
window.forceLogout = async () => {
  console.log('🚨 Force logout initiated...');
  
  // Clear ALL storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear global variables
  token = null;
  role = null;
  name = null;
  window.token = null;
  
  // Clear MSAL cache if available
  if (window.msalInstance) {
    try {
      await window.msalInstance.clearCache();
      console.log('✅ MSAL cache cleared');
    } catch (error) {
      console.warn('⚠️ Could not clear MSAL cache:', error);
    }
  }
  
  // Force redirect to origin
  window.location.href = window.location.origin;
};

// --- list helpers
function table(rows, canApprove=false){
  const tr = r => `<tr>
    <td>${r.id}</td><td>${r.date?.slice(0,10)||""}</td>
    <td>${r.worker_name}</td><td>${r.location||""}</td><td>${r.task||""}</td>
    <td>${r.risk_score} ${badge(r.risk_score)}</td>
    <td><span class="status-badge status-${r.status?.toLowerCase()}">${r.status||'Submitted'}</span></td>
    <td>${r.created_by_name||""}</td>
    <td>
      ${canApprove && r.status==='Pending' ? `
        <button data-approve="${r.id}" class="btn-approve" title="Godkänn">✓</button>
        <button data-reject="${r.id}" class="btn-reject" title="Avvisa">✗</button>
      `:''} 
      <button data-pdf="${r.id}" title="PDF">📄</button>
      ${canApprove ? `<button data-sp="${r.id}" title="SharePoint">📤</button>`:''} 
    </td>
  </tr>`;
  return `<table class="table">
    <thead><tr><th>ID</th><th>Datum</th><th>Namn</th><th>Plats</th><th>Uppgift</th><th>Risk</th><th>Status</th><th>Skapad av</th><th>Åtgärder</th></tr></thead>
    <tbody>${rows.map(tr).join("")}</tbody>
  </table>`;
}
function badge(score){
  if(score<=4) return `<span class="badge low">Låg</span>`;
  if(score<=9) return `<span class="badge mid">Medel</span>`;
  return `<span class="badge high">Hög</span>`;
}

async function loadMine(){
  try {
    const freshToken = await getFreshToken();
    const res = await fetch(API+"/api/assessments?mine=1",{headers:{Authorization:'Bearer '+freshToken}});
    const rows = await res.json();
    $("#mineTable").innerHTML = table(rows,false);
  } catch (error) {
    console.error('Load mine error:', error);
    if (error.message.includes('No valid token')) {
      alert('Din session har gått ut. Vänligen logga in igen.');
      localStorage.clear();
      location.reload();
    }
  }
}
async function loadDash(){
  try {
    const freshToken = await getFreshToken();
    const st = await fetch(API+"/api/assessments/stats",{headers:{Authorization:'Bearer '+freshToken}}).then(r=>r.json());
    $("#stats").innerHTML = `
      <div>Totalt: <b>${st.total||0}</b></div>
      <div>Öppna: <b>${st.open||0}</b></div>
      <div>Låg: <b>${st.low||0}</b> • Medel: <b>${st.mid||0}</b> • Hög: <b>${st.high||0}</b>
    `;
    const all = await fetch(API+"/api/assessments",{headers:{Authorization:'Bearer '+freshToken}}).then(r=>r.json());
    const canApprove = (role==="supervisor"||role==="superintendent"||role==="admin"||role==="arbetsledare");
    $("#allTable").innerHTML = table(all, canApprove);
  } catch (error) {
    console.error('Dashboard load error:', error);
    if (error.message.includes('No valid token')) {
      alert('Din session har gått ut. Vänligen logga in igen.');
      localStorage.clear();
      location.reload();
    }
  }
  $("#allTable").onclick = async (e)=>{
  const id = e.target?.dataset?.approve;
  const rejectId = e.target?.dataset?.reject;
  const pdfId = e.target?.dataset?.pdf;
  const spId  = e.target?.dataset?.sp;

  try {
    const freshToken = await getFreshToken();
    
    if (id) {
      await fetch(API+`/api/assessments/${id}/approve`,{method:"POST",headers:{Authorization:'Bearer '+freshToken}});
      window.showNotification('Riskbedömning godkänd! Användaren har meddelats.', 'success');
      loadDash(); return;
    }
    if (rejectId) {
      const reason = prompt('Anledning till avvisning (valfritt):');
      await fetch(API+`/api/assessments/${rejectId}/reject`,{
        method:"POST",
        headers:{Authorization:'Bearer '+freshToken, 'Content-Type':'application/json'},
        body: JSON.stringify({reason})
      });
      window.showNotification('Riskbedömning avvisad! Användaren har meddelats.', 'info');
      loadDash(); return;
    }
    if (pdfId) {
      window.open(API+`/api/assessments/${pdfId}/pdf?auth=${freshToken}`,'_blank');
      return;
    }
    if (spId) {
      const res = await fetch(API+`/api/assessments/${spId}/upload`,{method:"POST",headers:{Authorization:'Bearer '+freshToken}});
      const js = await res.json();
      if(res.ok){ alert("Uppladdad till SharePoint:\n"+js.webUrl); } else { alert("Fel vid uppladdning"); }
      return;
    }
  } catch (error) {
    console.error('Action error:', error);
    if (error.message.includes('No valid token')) {
      alert('Din session har gått ut. Vänligen logga in igen.');
      localStorage.clear();
      location.reload();
    }
  }
};

}
$("#refreshDash").onclick = loadDash;

// --- Users (Admin)
async function loadUsers(){
  if(role!=="admin") return;
  try {
    const freshToken = await getFreshToken();
    const res = await fetch(API+"/api/users",{headers:{Authorization:'Bearer '+freshToken}});
    const rows = await res.json();
    $("#usersTable").innerHTML = `
      <table class="table"><thead><tr><th>ID</th><th>Namn</th><th>Användare</th><th>Roll</th><th>Aktiv</th><th>Ändra</th><th>Radera</th></tr></thead>
      <tbody>
      ${rows.map(r=>`<tr>
        <td><button data-edit="${r.id}">Ändra</button></td>
        <td><button data-del="${r.id}">Radera</button></td>
      </tr>`).join("")}
      </tbody></table>
    `;
    $("#usersTable").onclick = async e=>{
      if(e.target.dataset.del){
        const id = +e.target.dataset.del;
        const freshToken = await getFreshToken();
        await fetch(API+"/api/users/"+id,{method:"DELETE",headers:{Authorization:'Bearer '+freshToken}});
        loadUsers();
      }
      if(e.target.dataset.edit){
        const id = +e.target.dataset.edit;
        const name = prompt("Nytt namn:"); if(!name) return;
        const role = prompt("Roll (underhall/supervisor/superintendent/admin/arbetsledare):");
        const active = prompt("Aktiv? (1/0):","1");
        const freshToken = await getFreshToken();
        await fetch(API+"/api/users/"+id,{method:"PUT",
          headers:{Authorization:'Bearer '+freshToken,'Content-Type':'application/json'},
          body: JSON.stringify({name,role,active:+active})
        });
        loadUsers();
      }
    };
  } catch (error) {
    console.error('Load users error:', error);
    if (error.message.includes('No valid token')) {
      alert('Din session har gått ut. Vänligen logga in igen.');
      localStorage.clear();
      location.reload();
    }
  }
}
$("#addUser").onclick = async ()=>{
  try {
    const freshToken = await getFreshToken();
    const body = {
      name: $("#u_name").value.trim(),
      username: $("#u_user").value.trim(),
      password: $("#u_pass").value,
      role: $("#u_role").value,
      active: +$("#u_active").value
    };
    const res = await fetch(API+"/api/users",{method:"POST",headers:{Authorization:'Bearer '+freshToken,'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(res.ok){ loadUsers(); } else { alert("Kunde inte skapa användare"); }
  } catch (error) {
    console.error('Add user error:', error);
    if (error.message.includes('No valid token')) {
      alert('Din session har gått ut. Vänligen logga in igen.');
      localStorage.clear();
      location.reload();
    }
  }
};
