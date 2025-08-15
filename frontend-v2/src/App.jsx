import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense, useEffect } from 'react';

// Layouts
import VendorLayout from './components/layout/VendorLayout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingSpinner from './components/ui/Loading';
import useAuthStore from './stores/authStore';

// Public Pages
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const PublicForm = lazy(() => import('./pages/public/PublicForm'));
const BusinessProfile = lazy(() => import('./pages/public/BusinessProfile'));

// Auth Pages
const Login = lazy(() => import('./components/auth/Login'));
const Signup = lazy(() => import('./components/auth/Signup'));

// Vendor Pages
const Dashboard = lazy(() => import('./pages/vendor/Dashboard'));
const Forms = lazy(() => import('./pages/vendor/Forms'));
const Analytics = lazy(() => import('./pages/vendor/Analytics'));
const Profile = lazy(() => import('./pages/vendor/Profile'));
const Subscription = lazy(() => import('./pages/vendor/Subscription'));
const QRCodes = lazy(() => import('./pages/vendor/QRCodes'));
const FormBuilder = lazy(() => import('./pages/vendor/FormBuilder'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const BusinessManagement = lazy(() => import('./pages/admin/BusinessManagement'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Suspense fallback={<LoadingSpinner.Page />}>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route 
                path="/login" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Login />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/signup" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Signup />
                  </ProtectedRoute>
                } 
              />
              <Route path="/form/:businessId/:formId" element={<PublicForm />} />
              <Route path="/form/:formId" element={<PublicForm />} />
              <Route path="/business/:businessId" element={<BusinessProfile />} />

              {/* Vendor Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredRole="vendor">
                    <VendorLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
              </Route>
              <Route
                path="/forms"
                element={
                  <ProtectedRoute requiredRole="vendor">
                    <VendorLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Forms />} />
                <Route path="new" element={<FormBuilder />} />
                <Route path="builder" element={<FormBuilder />} />
                <Route path="builder/:formId" element={<FormBuilder />} />
                <Route path="edit/:formId" element={<FormBuilder />} />
              </Route>
              <Route
                path="/form-builder"
                element={
                  <ProtectedRoute requiredRole="vendor">
                    <VendorLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<FormBuilder />} />
                <Route path=":formId" element={<FormBuilder />} />
              </Route>
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute requiredRole="vendor">
                    <VendorLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Analytics />} />
              </Route>
              <Route
                path="/qr-codes"
                element={
                  <ProtectedRoute requiredRole="vendor">
                    <VendorLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<QRCodes />} />
              </Route>
              <Route
                path="/profile"
                element={
                  <ProtectedRoute requiredRole="vendor">
                    <VendorLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Profile />} />
              </Route>
              <Route
                path="/subscription"
                element={
                  <ProtectedRoute requiredRole="vendor">
                    <VendorLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Subscription />} />
              </Route>

              {/* Vendor fallback route */}
              <Route 
                path="/vendor/*" 
                element={
                  <ProtectedRoute requiredRole="vendor">
                    <Navigate to="/dashboard" replace />
                  </ProtectedRoute>
                } 
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="businesses" element={<BusinessManagement />} />
                <Route path="users" element={<UserManagement />} />
              </Route>

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Suspense>
        <Toaster position="top-right" />
      </Router>
    </QueryClientProvider>
  );
}

export default App;