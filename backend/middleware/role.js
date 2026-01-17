// middleware/role.js

/**
 * Role-based access control middleware
 * Usage: role('inventory', 'manager')
 */
module.exports = function (...allowedRoles) {
  return (req, res, next) => {
    // auth middleware MUST run before this
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  };
};
