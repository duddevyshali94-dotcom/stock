/**
 * Middleware to check user roles for RBAC
 * @param {Array} allowedRoles - Array of roles allowed to access the route
 */
const roleMiddleware = (allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      // In Phase 2, we will query the 'profiles' or 'roles' table in the database
      // For now, we check the user metadata provided by Supabase Auth
      const userRole = req.user.user_metadata?.role || 'user';

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: 'Forbidden: Access denied' });
      }

      next();
    } catch (err) {
      console.error('Role middleware error:', err.message);
      return res.status(500).json({ message: 'Internal server error during role verification' });
    }
  };
};

module.exports = roleMiddleware;
