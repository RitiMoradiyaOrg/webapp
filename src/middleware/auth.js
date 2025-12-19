const User = require('../models/User');

// Basic Authentication Middleware
async function basicAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  // Check if Authorization header exists
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).set('WWW-Authenticate', 'Basic').end();
  }

  try {
    // Decode Base64 credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    // Find user by username (email)
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(401).set('WWW-Authenticate', 'Basic').end();
    }

    // Validate password
    const isValid = user.validatePassword(password);
    
    if (!isValid) {
      return res.status(401).set('WWW-Authenticate', 'Basic').end();
    }

    // Attach user to request object
    req.user = user;
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).set('WWW-Authenticate', 'Basic').end();
  }
}

module.exports = { basicAuth };