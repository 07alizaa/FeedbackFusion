import { useState, Fragment } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import {
  ChartBarIcon,
  DocumentTextIcon,
  HomeIcon,
  QrCodeIcon,
  UserIcon,
  CreditCardIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import useAuthStore from '../../stores/authStore';
import { authAPI } from '../../lib/api';
import { getInitials } from '../../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Forms', href: '/forms', icon: DocumentTextIcon },
  { name: 'Form Builder', href: '/form-builder', icon: PencilSquareIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'QR Codes', href: '/qr-codes', icon: QrCodeIcon },
  { name: 'Profile', href: '/profile', icon: UserIcon },
  { name: 'Subscription', href: '/subscription', icon: CreditCardIcon },
];

const VendorLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      clearAuth();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.log('Logout error:', error);
      toast.error('Failed to log out. Please try again.');
      // Even if logout API fails, clear local auth
      clearAuth();
      navigate('/login');
    }
  };

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 md:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 flex z-40">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <XMarkIcon className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                  <div className="flex-shrink-0 flex items-center px-4">
                    <h1 className="text-xl font-bold text-primary-600">FeedbackFusion</h1>
                  </div>
                  <nav className="mt-5 px-2 space-y-1">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`${
                            isActive(item.href)
                              ? 'bg-primary-100 text-primary-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <Icon className="mr-4 h-6 w-6" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
                <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {getInitials(user?.name || 'User')}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-primary-600">FeedbackFusion</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        isActive(item.href)
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center w-full">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {getInitials(user?.name || 'User')}
                    </span>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
                  title="Logout"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        {/* Desktop header */}
        <div className="hidden md:block bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
                </h2>
              </div>
              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <BellIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Logout"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default VendorLayout;
