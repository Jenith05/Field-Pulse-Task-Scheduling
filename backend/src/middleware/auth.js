const { verifyToken } = require('../utils/auth');
const User = require('../models/User');

/**
 * Authentication middleware - verifies JWT token
 */
async function authenticate(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Authorization middleware - ensures user is a dispatcher
 */
function requireDispatcher(req, res, next) {
  if (req.user.role !== 'dispatcher') {
    return res.status(403).json({ error: 'Dispatcher access required' });
  }
  next();
}

/**
 * Authorization middleware - ensures user is a technician
 */
function requireTechnician(req, res, next) {
  if (req.user.role !== 'technician') {
    return res.status(403).json({ error: 'Technician access required' });
  }
  next();
}

module.exports = {
  authenticate,
  requireDispatcher,
  requireTechnician
};