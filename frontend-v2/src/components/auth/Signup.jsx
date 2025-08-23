import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { authAPI } from '../../lib/api';

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      role: 'vendor'
    }
  });

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const { confirmPassword: _confirmPassword, ...signupData } = data;
      await authAPI.signup(signupData);
      
      toast.success('Business account created successfully! Your account is pending admin approval. You will be notified once approved.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Outer Frame */}
      <div className="max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-primary-100">
        <div className="flex flex-col lg:flex-row min-h-[800px]">
          
          {/* Left Side - Signup Form */}
          <div className="flex-1 p-8 lg:p-12 flex items-center justify-center">
            <div className="max-w-md w-full space-y-8">
              {/* Header */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl mb-6 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">FeedbackFusion</h1>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Create your business account
                </h2>
                <p className="text-gray-600">
                  Join FeedbackFusion to collect and manage customer feedback
                </p>
              </div>

              {/* Form */}
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-5">
                  <Input
                    label="Full Name"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    error={errors.name?.message}
                    {...register('name', {
                      required: 'Name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters',
                      },
                    })}
                  />

                  <Input
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    error={errors.email?.message}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Please enter a valid email',
                      },
                    })}
                  />

                  <Input
                    label="Business Name"
                    type="text"
                    autoComplete="organization"
                    placeholder="Enter your business name"
                    error={errors.businessName?.message}
                    {...register('businessName', {
                      required: 'Business name is required'
                    })}
                  />

                  {/* Hidden field - all signups are vendors */}
                  <input type="hidden" {...register('role')} value="vendor" />

                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    error={errors.password?.message}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    }
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 12,
                        message: 'Password must be at least 12 characters',
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
                        message: 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)',
                      },
                    })}
                  />

                  <Input
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    error={errors.confirmPassword?.message}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    }
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) =>
                        value === password || 'Passwords do not match',
                    })}
                  />
                </div>

                <div className="flex items-start">
                  <input
                    id="agree-terms"
                    name="agree-terms"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                    {...register('agreeTerms', {
                      required: 'You must agree to the terms and conditions',
                    })}
                  />
                  <label htmlFor="agree-terms" className="ml-3 block text-sm text-gray-700 leading-relaxed">
                    I agree to the{' '}
                    <Link to="/terms" className="text-primary-600 hover:text-primary-500 font-medium transition-colors">
                      Terms and Conditions
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-primary-600 hover:text-primary-500 font-medium transition-colors">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                {errors.agreeTerms && (
                  <p className="text-sm text-danger-600 mt-1">{errors.agreeTerms.message}</p>
                )}

                <Button
                  type="submit"
                  className="w-full py-3 text-lg font-semibold"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Create Business Account
                </Button>
              </form>

              {/* Notice */}
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-primary-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm text-primary-800 font-medium">Account Approval Required</p>
                    <p className="text-sm text-primary-700 mt-1">
                      Your business account will be reviewed and approved by our admin team. You'll be notified once approved.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-primary-600 hover:text-primary-500 transition-colors"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Image/Visual */}
          <div className="flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden lg:flex hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="signup-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#signup-grid)" />
              </svg>
            </div>
            
            {/* Content */}
            <div className="relative z-10 p-12 flex flex-col justify-center items-center text-center text-white">
              <div className="mb-8">
                <div className="w-32 h-32 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold mb-4">
                  Join Our Growing Community
                </h3>
                <p className="text-xl text-primary-100 leading-relaxed max-w-md">
                  Start your journey to better customer relationships and business growth with our trusted feedback platform.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-4 text-left max-w-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-success-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-primary-100">Easy Setup Process</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-success-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-primary-100">Professional Dashboard</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-success-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-primary-100">Secure & Compliant</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-success-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-primary-100">24/7 Support</span>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-12 grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">10K+</div>
                  <div className="text-sm text-primary-200">Businesses</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">1M+</div>
                  <div className="text-sm text-primary-200">Feedback</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">99.9%</div>
                  <div className="text-sm text-primary-200">Uptime</div>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
            <div className="absolute bottom-20 left-10 w-16 h-16 bg-white/5 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 right-20 w-12 h-12 bg-white/10 rounded-full animate-pulse delay-500"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
