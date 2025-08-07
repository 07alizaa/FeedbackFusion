// middleware/roleMiddleware.js - Role-based access control middleware
// Note: This middleware should be used AFTER authMiddleware

// Middleware to restrict access to vendor role only
const requireVendor = (req, res, next) => {
  try {
    console.log('requireVendor middleware called for:', req.method, req.path, 'User:', req.user?.role);
    
    // Check if user is authenticated
    if (!req.user) {
      console.log('No user in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has vendor role
    if (req.user.role !== 'vendor') {
      console.log('User role mismatch:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Vendor role required.'
      });
    }

    console.log('requireVendor middleware passed');
    next();

  } catch (error) {
    console.error('Vendor role middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during role verification'
    });
  }
};

// Middleware to restrict access to admin role only
const requireAdmin = (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    next();

  } catch (error) {
    console.error('Admin role middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during role verification'
    });
  }
};

// Middleware to allow both vendor and admin roles
const requireVendorOrAdmin = (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has vendor or admin role
    if (!['vendor', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Vendor or Admin role required.'
      });
    }

    next();

  } catch (error) {
    console.error('Vendor/Admin role middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during role verification'
    });
  }
};

// Higher-order function to create role-based middleware for specific roles
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Convert to array if single role is provided
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      // Check if user has one of the allowed roles
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role(s): ${roles.join(', ')}`
        });
      }

      next();

    } catch (error) {
      console.error('Role middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during role verification'
      });
    }
  };
};

module.exports = {
  requireVendor,
  requireAdmin,
  requireVendorOrAdmin,
  requireRole
};
