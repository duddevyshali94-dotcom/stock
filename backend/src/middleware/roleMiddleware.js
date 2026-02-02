const { supabaseAdmin } = require('../config/supabase');

function checkRole(...allowedRoles) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }
      
      const { data: userProfile, error } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', req.user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to verify user role'
        });
      }
      
      if (!userProfile) {
        return res.status(404).json({
          success: false,
          error: 'User profile not found'
        });
      }
      
      const userRole = userProfile.role || 'user';
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }
      
      req.userRole = userRole;
      
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Role verification failed'
      });
    }
  };
}

module.exports = {
  checkRole
};
