require('dotenv').config();
const express = require('express');
const cors = require('cors');
const billRoutes = require('./routes/bills');
const driveService = require('./services/driveService');
const { OAuth2Client } = require('google-auth-library');

const ALLOWED_EMAILS = ['pankajjainrp@gmail.com', 'en23cs301342@gmail.com'];

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Auth Routes
app.get('/api/auth/url', (req, res) => {
  try {
    const isAuth = driveService.initAuth();
    if (isAuth) {
      res.json({ authenticated: true });
    } else {
      res.json({ authenticated: false, url: driveService.getAuthUrl() });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/client-id', (req, res) => {
  try {
    const clientId = driveService.getClientId();
    res.json({ clientId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/callback', async (req, res) => {
  const code = req.query.code;
  if (code) {
    try {
      await driveService.setCode(code);
      res.send('<h3 style="font-family:sans-serif;text-align:center;margin-top:50px;">Authentication successful! You can close this tab and refresh the dashboard.</h3><script>setTimeout(() => window.close(), 3000)</script>');
    } catch (error) {
      res.status(500).send('Error authenticating: ' + error.message);
    }
  } else {
    res.status(400).send('No code provided');
  }
});

// Middleware to check authentication before accessing bills
app.use('/api/bills', async (req, res, next) => {
  try {
    if (!driveService.initAuth()) {
      return res.status(401).json({ error: 'Not authenticated with Google. Please authenticate first.' });
    }
    
    // Check User Authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const clientId = driveService.getClientId();
    const client = new OAuth2Client(clientId);
    
    try {
      const ticket = await client.verifyIdToken({
          idToken: token,
          audience: clientId,
      });
      const payload = ticket.getPayload();
      const userEmail = payload.email;
      
      if (!ALLOWED_EMAILS.includes(userEmail)) {
        return res.status(403).json({ error: `Access Denied: ${userEmail} is not authorized to access this website.` });
      }
      
      // User is authenticated and authorized
      req.user = payload;
      next();
    } catch (tokenError) {
      return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}, billRoutes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
