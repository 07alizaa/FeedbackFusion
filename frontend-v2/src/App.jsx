import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense } from 'react';

// Layouts
import VendorLayout from './components/layout/VendorLayout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingSpinner from './components/ui/Loading';

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
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Suspense fallback={<LoadingSpinner.Page />}>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/form/:businessId/:formId" element={<PublicForm />} />
              <Route path="/business/:businessId" element={<BusinessProfile />} />

              {/* Vendor Routes */}
              <Route
                path="/vendor"
                element={
                  <ProtectedRoute requiredRole="vendor">
                    <VendorLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="forms" element={<Forms />} />
                <Route path="forms/builder" element={<FormBuilder />} />
                <Route path="forms/builder/:formId" element={<FormBuilder />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="profile" element={<Profile />} />
                <Route path="subscription" element={<Subscription />} />
                <Route path="qr-codes" element={<QRCodes />} />
              </Route>

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