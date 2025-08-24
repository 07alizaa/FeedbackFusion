import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-primary-600 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group py-2">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                <svg className="w-7 h-7 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-white group-hover:text-primary-100 transition-all duration-300">
                FeedbackFusion
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            <a 
              href="#features" 
              className="text-primary-100 hover:text-white font-medium transition-all duration-200 hover:scale-105 relative group px-3 py-2"
            >
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a 
              href="#pricing" 
              className="text-primary-100 hover:text-white font-medium transition-all duration-200 hover:scale-105 relative group px-3 py-2"
            >
              Pricing
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a 
              href="#testimonials" 
              className="text-primary-100 hover:text-white font-medium transition-all duration-200 hover:scale-105 relative group px-3 py-2"
            >
              Testimonials
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
            </a>
            <div className="hidden xl:block w-px h-6 bg-primary-400 mx-2"></div>
            <Link 
              to="/login" 
              className="text-primary-100 hover:text-white font-medium transition-all duration-200 hover:scale-105 relative group px-3 py-2"
            >
              Sign In
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link to="/signup">
              <Button className="bg-yellow-400 text-gray-900 hover:bg-yellow-300 hover:text-gray-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold px-6 py-2.5">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Tablet Navigation - Simplified */}
          <div className="hidden md:flex lg:hidden items-center space-x-4">
            <Link 
              to="/login" 
              className="text-primary-100 hover:text-white font-medium transition-all duration-200 px-3 py-2"
            >
              Sign In
            </Link>
            <Link to="/signup">
              <Button className="bg-yellow-400 text-gray-900 hover:bg-yellow-300 hover:text-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-5 py-2">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-primary-100 p-3 rounded-lg hover:bg-primary-700 transition-all duration-200"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-primary-500 bg-primary-600">
            <div className="px-4 py-4 space-y-2">
              <a
                href="#features"
                className="block px-4 py-3 text-primary-100 hover:text-white hover:bg-primary-700 rounded-lg font-medium transition-all duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#pricing"
                className="block px-4 py-3 text-primary-100 hover:text-white hover:bg-primary-700 rounded-lg font-medium transition-all duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                className="block px-4 py-3 text-primary-100 hover:text-white hover:bg-primary-700 rounded-lg font-medium transition-all duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Testimonials
              </a>
              <div className="border-t border-primary-500 pt-3 mt-3">
                <Link
                  to="/login"
                  className="block px-4 py-3 text-primary-100 hover:text-white hover:bg-primary-700 rounded-lg font-medium transition-all duration-200 mb-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <div className="px-4">
                  <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full bg-yellow-400 text-gray-900 hover:bg-yellow-300 hover:text-gray-800 py-3 font-semibold">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;
