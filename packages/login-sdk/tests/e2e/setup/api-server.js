/**
 * API Server for E2E tests
 * 
 * This server simulates the Unidy API server for E2E testing.
 * It provides authentication endpoints and handles token issuance and validation.
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// Create Express app
const app = express();
const PORT = 4000;

// JWT secret for token signing
const JWT_SECRET = 'test-secret-key';

// Middleware
app.use(cors({
  origin: 'http://localhost:4001',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Test users
const users = {
  'test-user': {
    password: 'test-password',
    name: 'Test User',
    email: 'test@example.com'
  },
  'invalid-user': {
    password: 'wrong-password',
    name: 'Invalid User',
    email: 'invalid@example.com'
  }
};

// OAuth authorize endpoint
app.get('/oauth/authorize', (req, res) => {
  const { client_id, scope, response_type, redirect_uri, prompt, max_age, nonce } = req.query;
  
  // Validate required parameters
  if (!client_id || !scope || !response_type || !redirect_uri) {
    return res.status(400).send('Missing required parameters');
  }
  
  // Render login form (simplified for testing)
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Unidy Login</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .login-form { max-width: 400px; margin: 0 auto; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input { width: 100%; padding: 8px; box-sizing: border-box; }
        button { padding: 10px 15px; background: #007bff; color: white; border: none; cursor: pointer; }
        .error-message { color: red; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="login-form">
        <h2>Log in to Unidy</h2>
        <form id="login-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
          </div>
          <button type="submit" id="login-submit">Log In</button>
          <div id="error-message" class="error-message"></div>
        </form>
      </div>
      
      <script>
        document.getElementById('login-form').addEventListener('submit', function(e) {
          e.preventDefault();
          
          const username = document.getElementById('username').value;
          const password = document.getElementById('password').value;
          
          // Simulate authentication
          if (username === 'test-user' && password === 'test-password') {
            // Generate ID token
            const idToken = 'header.' + btoa(JSON.stringify({
              sub: username,
              name: 'Test User',
              email: 'test@example.com',
              exp: Math.floor(Date.now() / 1000) + 3600
            })) + '.signature';
            
            // Redirect back to the iframe callback URL with the token
            const callbackUrl = new URL('${redirect_uri}');
            callbackUrl.searchParams.append('id_token', idToken);
            window.location.href = callbackUrl.toString();
          } else {
            document.getElementById('error-message').textContent = 'Invalid credentials';
          }
        });
      </script>
    </body>
    </html>
  `);
});

// OAuth iframe callback endpoint
app.get('/oauth/iframe', (req, res) => {
  const { callback_url, id_token } = req.query;
  
  // Render iframe callback page
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Unidy Auth Callback</title>
    </head>
    <body>
      <script>
        // Post message back to the parent window
        window.parent.postMessage({
          action: 'auth',
          idToken: '${id_token || ''}'
        }, '${callback_url || '*'}');
      </script>
    </body>
    </html>
  `);
});

// OAuth userinfo endpoint
app.get('/oauth/userinfo', (req, res) => {
  // Check for authorization header or cookie
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(' ')[1] : req.cookies.id_token;
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // For testing, we just check if the token exists
    // In a real implementation, we would verify the token
    const payload = token.split('.')[1];
    if (!payload) {
      throw new Error('Invalid token');
    }
    
    // Return user info
    res.json({
      sub: 'test-user',
      name: 'Test User',
      email: 'test@example.com'
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// OAuth logout endpoint
app.get('/oauth/logout', (req, res) => {
  // Clear cookies
  res.clearCookie('id_token');
  
  // Return success
  res.json({ success: true });
});

// Start server
function startServer() {
  return app.listen(PORT, () => {
    console.log(`API Server running at http://localhost:${PORT}`);
  });
}

// Export for use in start-servers.js
module.exports = { startServer };

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}