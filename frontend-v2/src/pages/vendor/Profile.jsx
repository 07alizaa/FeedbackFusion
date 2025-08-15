import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import {
  UserIcon,
  BuildingOfficeIcon,
  CameraIcon,
  PhoneIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { authAPI, businessAPI } from '../../lib/api';
import useAuthStore from '../../stores/authStore';

const Profile = () => {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [businessProfile, setBusinessProfile] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      businessName: user?.businessName || '',
      phone: user?.phone || '',
      industry: user?.industry || '',
      website: user?.website || '',
    },
  });

  useEffect(() => {
    fetchBusinessProfile();
    reset({
      name: user?.name || '',
      email: user?.email || '',
      businessName: user?.businessName || '',
      phone: user?.phone || '',
      industry: user?.industry || '',
      website: user?.website || '',
    });
  }, [user, reset]);

  const fetchBusinessProfile = async () => {
    try {
      const response = await businessAPI.getUserProfile();
      setBusinessProfile(response.data.data);
    } catch (error) {
      console.error('Error fetching business profile:', error);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await authAPI.updateProfile(data);
      updateUser(response.data.data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-600">
          Manage your account settings and business information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <Card>
            <Card.Header>
              <Card.Title>Profile Overview</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="text-center">
                <div className="relative mx-auto w-24 h-24">
                  <div className="w-24 h-24 rounded-full bg-primary-500 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-lg border">
                    <CameraIcon className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {user?.name || 'User Name'}
                </h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <div className="mt-2">
                  <Badge status={user?.role === 'vendor' ? 'active' : 'warning'}>
                    {user?.role === 'vendor' ? 'Vendor' : 'Admin'}
                  </Badge>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center text-sm">
                  <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">
                    {user?.businessName || 'No business name'}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">
                    {user?.phone || 'No phone number'}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <GlobeAltIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">
                    {user?.website || 'No website'}
                  </span>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
            <Card.Header>
              <Card.Title>Quick Stats</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Member since</span>
                  <span className="text-sm font-medium">
                    {user?.created_at ? new Date(user.created_at).getFullYear() : '2024'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total forms</span>
                  <span className="text-sm font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total responses</span>
                  <span className="text-sm font-medium">0</span>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Card>
            <Card.Header>
              <Card.Title>Edit Profile</Card.Title>
              <Card.Description>
                Update your personal and business information
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
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
                    label="Email Address"
                    type="email"
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
                    error={errors.businessName?.message}
                    {...register('businessName')}
                  />

                  <Input
                    label="Phone Number"
                    type="tel"
                    error={errors.phone?.message}
                    {...register('phone')}
                  />

                  <Input
                    label="Industry"
                    error={errors.industry?.message}
                    {...register('industry')}
                  />

                  <Input
                    label="Website"
                    type="url"
                    placeholder="https://example.com"
                    error={errors.website?.message}
                    {...register('website')}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={loading}
                  >
                    Update Profile
                  </Button>
                </div>
              </form>
            </Card.Content>
          </Card>

          {/* Business Profile Settings */}
          <Card className="mt-6">
            <Card.Header>
              <Card.Title>Business Profile</Card.Title>
              <Card.Description>
                Manage your public business profile
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Public Profile
                    </h4>
                    <p className="text-sm text-gray-500">
                      Make your business discoverable to customers
                    </p>
                  </div>
                  <Badge status={businessProfile ? 'active' : 'inactive'}>
                    {businessProfile ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {businessProfile && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Your business profile is live at:
                    </p>
                    <Link
                      to={`/b/${businessProfile.slug}`}
                      className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                    >
                      {window.location.origin}/b/{businessProfile.slug}
                    </Link>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button variant="outline" size="sm">
                    {businessProfile ? 'Edit Profile' : 'Create Profile'}
                  </Button>
                  {businessProfile && (
                    <Button variant="outline" size="sm">
                      View Public Profile
                    </Button>
                  )}
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
