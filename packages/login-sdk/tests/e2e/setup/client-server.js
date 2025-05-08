/**
 * Client Server for E2E tests
 * 
 * This server serves the test application for E2E testing.
 * It hosts the login SDK and makes cross-origin requests to the API server.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = 4001;

// Serve static files
app.use(express.static(path.join(__dirname, '../test-app')));

// Serve the SDK build
app.use('/login-sdk', express.static(path.join(__dirname, '../../../dist')));

// Create test app directory if it doesn't exist
const testAppDir = path.join(__dirname, '../test-app');
if (!fs.existsSync(testAppDir)) {
  fs.mkdirSync(testAppDir, { recursive: true });
}

// Create login-sdk directory inside test-app if it doesn't exist
const loginSdkDir = path.join(testAppDir, 'login-sdk');
if (!fs.existsSync(loginSdkDir)) {
  fs.mkdirSync(loginSdkDir, { recursive: true });
}

// Create a simple test app if it doesn't exist
const testAppFile = path.join(testAppDir, 'index.html');
if (!fs.existsSync(testAppFile)) {
  const testAppContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Unidy Login SDK Test App</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; }
    .button { padding: 10px 15px; background: #007bff; color: white; border: none; cursor: pointer; margin-right: 10px; }
    .button.secondary { background: #6c757d; }
    .button-group { margin: 20px 0; }
    .card { border: 1px solid #ddd; border-radius: 4px; padding: 20px; margin-bottom: 20px; }
    .hidden { display: none; }
    #user-info { margin-top: 20px; }
    #session-expired-message { color: red; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Unidy Login SDK Test App</h1>
    
    <div class="card">
      <h2>Authentication</h2>
      <div class="button-group">
        <button id="login-button" class="button">Login</button>
        <button id="logout-button" class="button secondary">Logout</button>
      </div>
      
      <div id="user-info" class="hidden">
        <h3>User Information</h3>
        <pre id="user-info-content"></pre>
      </div>
      
      <div id="session-expired-message" class="hidden">
        Your session has expired. Please log in again.
      </div>
    </div>
    
    <div class="card">
      <h2>Test Controls</h2>
      <div class="button-group">
        <button id="expire-session-button" class="button secondary">Simulate Session Expiry</button>
        <button id="trigger-error-button" class="button secondary">Trigger Error</button>
      </div>
    </div>
  </div>
  
  <!-- Include the SDK -->
  <script src="/login-sdk/unidy-login.js"></script>
  
  <script>
    // Initialize the SDK
    const Auth = new UnidyLoginSDK.Auth('http://localhost:4000', {
      clientId: 'test-client-id',
      scope: 'openid profile',
      responseType: 'id_token',
      autoRefresh: true,
      refreshInterval: 10, // 10 seconds for testing
      sessionCheckInterval: 5 // 5 seconds for testing
    });
    
    // Set up authentication handler
    Auth.onAuth(function(idToken) {
      console.log('User authenticated:', idToken);
      
      // Parse the token
      const tokenParts = idToken.split('.');
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(atob(tokenParts[1]));
          document.getElementById('user-info-content').textContent = JSON.stringify(payload, null, 2);
          document.getElementById('user-info').classList.remove('hidden');
          document.getElementById('session-expired-message').classList.add('hidden');
        } catch (error) {
          console.error('Error parsing token:', error);
        }
      }
    });
    
    // Set up logout handler
    Auth.onLogout(function() {
      console.log('User logged out');
      document.getElementById('user-info').classList.add('hidden');
    });
    
    // Set up error handler
    Auth.on('error', function(error) {
      console.error('SDK error:', error);
    });
    
    // Set up session expired handler
    Auth.on('session:expired', function() {
      console.log('Session expired');
      document.getElementById('session-expired-message').classList.remove('hidden');
      document.getElementById('user-info').classList.add('hidden');
    });
    
    // Initialize the SDK
    Auth.init();
    
    // Add event listeners
    document.getElementById('login-button').addEventListener('click', function() {
      Auth.show();
    });
    
    document.getElementById('logout-button').addEventListener('click', function() {
      Auth.logout();
    });
    
    document.getElementById('expire-session-button').addEventListener('click', function() {
      // Simulate session expiry by clearing the token
      sessionStorage.removeItem('idToken');
      
      // Trigger session expired event
      Auth.emit('session:expired', { expiredAt: new Date() });
    });
    
    document.getElementById('trigger-error-button').addEventListener('click', function() {
      // Simulate an error
      Auth.emit('error', {
        type: 'test_error',
        message: 'This is a test error',
        timestamp: new Date()
      });
    });
  </script>
</body>
</html>
  `;
  
  fs.writeFileSync(testAppFile, testAppContent);
}

// Create a simple SDK build if it doesn't exist
const sdkBuildFile = path.join(loginSdkDir, 'unidy-login.js');
if (!fs.existsSync(sdkBuildFile)) {
  // Create a simple mock SDK build for testing
  const sdkBuildContent = `
// Mock SDK build for testing
window.UnidyLoginSDK = {
  Auth: function(unidyUrl, options) {
    console.log('Initializing Auth with URL:', unidyUrl, 'and options:', options);
    
    // Event listeners
    const listeners = {
      auth: null,
      logout: null,
      error: null,
      tokenRefresh: null,
      sessionExpired: null
    };
    
    // Event system
    const events = {};
    
    function on(eventName, callback) {
      if (!events[eventName]) {
        events[eventName] = [];
      }
      events[eventName].push(callback);
      return this;
    }
    
    function off(eventName, callback) {
      if (!events[eventName]) return this;
      events[eventName] = events[eventName].filter(cb => cb !== callback);
      return this;
    }
    
    function emit(eventName, data) {
      if (!events[eventName]) return;
      events[eventName].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(\`Error in \${eventName} event handler:\`, error);
        }
      });
    }
    
    // Store listeners globally for access by other modules
    window.unidyLoginListeners = listeners;
    
    return {
      init: function() {
        console.log('Initializing SDK');
        return this;
      },
      
      show: function(options = { target: 'login' }) {
        console.log('Showing iframe with target:', options.target);
        
        // Create iframe for testing
        const body = document.getElementsByTagName('body')[0];
        const wrapperDiv = document.createElement('div');
        wrapperDiv.setAttribute('id', 'unidyAuthFrameWrapper');
        wrapperDiv.style.display = 'flex';
        wrapperDiv.classList.add('active');
        
        const iframe = document.createElement('iframe');
        iframe.setAttribute('id', 'unidyAuthFrame');
        iframe.setAttribute('src', unidyUrl + '/oauth/authorize?client_id=' + options.clientId);
        
        wrapperDiv.appendChild(iframe);
        body.appendChild(wrapperDiv);
        
        // Add click handler to close iframe
        wrapperDiv.addEventListener('click', () => {
          this.close();
        });
        
        return this;
      },
      
      close: function() {
        console.log('Closing iframe');
        
        const wrapperDiv = document.getElementById('unidyAuthFrameWrapper');
        if (wrapperDiv) {
          wrapperDiv.remove();
        }
        
        return this;
      },
      
      onAuth: function(authHandler) {
        console.log('Setting auth handler');
        
        if (typeof authHandler === 'function') {
          listeners.auth = function({ idToken }) {
            try {
              sessionStorage.setItem('idToken', idToken);
              authHandler(idToken);
            } catch (error) {
              console.error('Error in auth handler:', error);
            }
          };
        }
        
        return this;
      },
      
      onLogout: function(logoutHandler) {
        console.log('Setting logout handler');
        
        if (typeof logoutHandler === 'function') {
          listeners.logout = function() {
            try {
              sessionStorage.clear();
              logoutHandler();
            } catch (error) {
              console.error('Error in logout handler:', error);
            }
          };
        }
        
        return this;
      },
      
      logout: function() {
        console.log('Logging out');
        
        sessionStorage.clear();
        
        if (listeners.logout) {
          listeners.logout({});
        }
        
        return this;
      },
      
      isAuthenticated: function() {
        return !!sessionStorage.getItem('idToken');
      },
      
      getIdToken: function() {
        return sessionStorage.getItem('idToken');
      },
      
      on,
      off,
      emit
    };
  }
};
  `;
  
  fs.writeFileSync(sdkBuildFile, sdkBuildContent);
}

// Start server
function startServer() {
  return app.listen(PORT, () => {
    console.log(`Client Server running at http://localhost:${PORT}`);
  });
}

// Export for use in start-servers.js
module.exports = { startServer };

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}