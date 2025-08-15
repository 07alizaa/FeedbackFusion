import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import LoadingSpinner from '../ui/Loading';

const ProtectedRoute = ({ children, requiredRole = null, requireAuth = true }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingSpinner.Page />;
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific role is required but user doesn't have it
  if (requiredRole && (!user || user.role !== requiredRole)) {
    // Redirect admin to admin panel, vendor to dashboard
    const redirectPath = user?.role === 'admin' ? '/admin' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // If user is authenticated but trying to access auth pages
  // Allow bypass with ?force=true for testing
  if (!requireAuth && isAuthenticated) {
    const searchParams = new URLSearchParams(location.search);
    const forceAccess = searchParams.get('force') === 'true';
    
    if (!forceAccess) {
      const redirectPath = user?.role === 'admin' ? '/admin' : '/dashboard';
      return <Navigate to={redirectPath} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
