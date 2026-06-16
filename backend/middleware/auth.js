const { verifyToken } = require('../utils/generateToken');
const { pool } = require('../config/db');

// Middleware: Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Get user with role info
    const [users] = await pool.execute(
      `SELECT u.user_id, u.username, u.email, u.role_id, r.role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.role_id 
       WHERE u.user_id = ? AND u.is_active = 1 AND u.role_id IS NOT NULL`,
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Account not active or pending approval.'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
      error: error.message
    });
  }
};

// Middleware: Role-Based Access Control (RBAC)
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated.'
      });
    }

    if (!allowedRoles.includes(req.user.role_name?.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
