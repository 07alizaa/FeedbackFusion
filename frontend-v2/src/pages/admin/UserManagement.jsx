import { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  TrashIcon,
  PencilIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  UserIcon,
  FunnelIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/Loading';
import { adminAPI } from '../../lib/api';
import { formatDate } from '../../lib/utils';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers();
      const userData = response.data.data || getMockUsers();
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Load mock data on error
      setUsers(getMockUsers());
    } finally {
      setLoading(false);
    }
  };

  const getMockUsers = () => [
    {
      id: 1,
      name: 'John Smith',
      email: 'john@techcorp.com',
      role: 'vendor',
      status: 'active',
      businessName: 'TechCorp Solutions',
      subscription: 'professional',
      createdAt: '2024-01-10T10:30:00Z',
      lastLoginAt: '2024-01-15T09:45:00Z',
      formsCount: 25,
      responsesCount: 1250,
      isEmailVerified: true,
      phone: '+1-555-0123',
      avatar: null,
    },
    {
      id: 2,
      name: 'Sarah Williams',
      email: 'sarah@digitaldynamics.com',
      role: 'vendor',
      status: 'active',
      businessName: 'Digital Dynamics',
      subscription: 'professional',
      createdAt: '2024-01-08T11:15:00Z',
      lastLoginAt: '2024-01-14T16:20:00Z',
      formsCount: 18,
      responsesCount: 890,
      isEmailVerified: true,
      phone: '+1-555-0789',
      avatar: null,
    },
    {
      id: 3,
      name: 'Michael Johnson',
      email: 'michael@nextgen.com',
      role: 'vendor',
      status: 'pending',
      businessName: 'NextGen Solutions',
      subscription: 'starter',
      createdAt: '2024-01-14T15:30:00Z',
      lastLoginAt: null,
      formsCount: 0,
      responsesCount: 0,
      isEmailVerified: false,
      phone: '+1-555-0456',
      avatar: null,
    },
    {
      id: 4,
      name: 'Emily Rodriguez',
      email: 'emily@innovationlabs.com',
      role: 'vendor',
      status: 'suspended',
      businessName: 'Innovation Labs',
      subscription: 'enterprise',
      createdAt: '2024-01-05T14:20:00Z',
      lastLoginAt: '2024-01-14T12:30:00Z',
      formsCount: 12,
      responsesCount: 560,
      isEmailVerified: true,
      phone: '+1-555-0345',
      avatar: null,
      suspensionReason: 'Terms of service violation',
    },
    {
      id: 5,
      name: 'Admin User',
      email: 'admin@feedbackfusion.com',
      role: 'admin',
      status: 'active',
      businessName: null,
      subscription: null,
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-15T10:00:00Z',
      formsCount: 0,
      responsesCount: 0,
      isEmailVerified: true,
      phone: '+1-555-ADMIN',
      avatar: null,
    },
    {
      id: 6,
      name: 'David Chen',
      email: 'david@greenearth.com',
      role: 'vendor',
      status: 'rejected',
      businessName: 'Green Earth Consultancy',
      subscription: 'starter',
      createdAt: '2024-01-12T09:45:00Z',
      lastLoginAt: '2024-01-13T08:30:00Z',
      formsCount: 0,
      responsesCount: 0,
      isEmailVerified: true,
      phone: '+1-555-0012',
      avatar: null,
      rejectionReason: 'Incomplete business documentation',
    },
  ];

  const filterUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.businessName && user.businessName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleUserAction = async (userId, action, reason = null) => {
    try {
      setActionLoading(userId);
      
      switch (action) {
        case 'activate':
          await adminAPI.activateUser(userId);
          break;
        case 'suspend':
          await adminAPI.suspendUser(userId, reason);
          break;
        case 'delete':
          await adminAPI.deleteUser(userId);
          break;
        default:
          throw new Error('Invalid action');
      }

      // Refresh users
      await fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge status="success">Active</Badge>;
      case 'pending':
        return <Badge status="warning">Pending</Badge>;
      case 'suspended':
        return <Badge status="danger">Suspended</Badge>;
      case 'rejected':
        return <Badge status="danger">Rejected</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge status="primary">Admin</Badge>;
      case 'vendor':
        return <Badge>Vendor</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getSubscriptionBadge = (subscription) => {
    if (!subscription) return null;
    
    switch (subscription) {
      case 'starter':
        return <Badge>Starter</Badge>;
      case 'professional':
        return <Badge status="primary">Professional</Badge>;
      case 'enterprise':
        return <Badge status="success">Enterprise</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return <LoadingSpinner.Page />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">
            Manage platform users and their permissions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge>{filteredUsers.length} users</Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <Card.Content className="p-4">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search users, emails, or businesses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="flex items-center space-x-2">
                <FunnelIcon className="h-4 w-4 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admins</option>
                  <option value="vendor">Vendors</option>
                </select>
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role & Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatar ? (
                          <img className="h-10 w-10 rounded-full" src={user.avatar} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-700">
                              {getInitials(user.name)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <EnvelopeIcon className="h-3 w-3 mr-1" />
                          {user.email}
                          {!user.isEmailVerified && (
                            <span className="ml-2 text-xs text-red-500">(Unverified)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.status)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.businessName ? (
                      <div>
                        <div className="text-sm text-gray-900 flex items-center">
                          <BuildingStorefrontIcon className="h-4 w-4 mr-2" />
                          {user.businessName}
                        </div>
                        {user.subscription && (
                          <div className="mt-1">
                            {getSubscriptionBadge(user.subscription)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No business</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <ChartBarIcon className="h-4 w-4 mr-1" />
                        {user.formsCount} forms
                      </div>
                      <div>{user.responsesCount} responses</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <CalendarDaysIcon className="h-4 w-4 mr-1" />
                        {formatDate(user.createdAt)}
                      </div>
                      {user.lastLoginAt && (
                        <div className="text-xs">
                          Last login: {formatDate(user.lastLoginAt)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      
                      {user.status === 'active' && user.role !== 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'suspend', 'Manual suspension')}
                          loading={actionLoading === user.id}
                          className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                        >
                          <ShieldExclamationIcon className="h-4 w-4" />
                        </Button>
                      )}

                      {user.status === 'suspended' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'activate')}
                          loading={actionLoading === user.id}
                          className="text-green-600 border-green-300 hover:bg-green-50"
                        >
                          <ShieldCheckIcon className="h-4 w-4" />
                        </Button>
                      )}

                      {user.role !== 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'delete')}
                          loading={actionLoading === user.id}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <UserIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'No users have been registered yet.'
              }
            </p>
          </div>
        )}
      </Card>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onAction={handleUserAction}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
};

// User Detail Modal Component
const UserDetailModal = ({ user, onClose, onAction, actionLoading }) => {
  const [suspendReason, setSuspendReason] = useState('');
  const [showSuspendForm, setShowSuspendForm] = useState(false);

  const handleSuspend = () => {
    if (suspendReason.trim()) {
      onAction(user.id, 'suspend', suspendReason);
      setShowSuspendForm(false);
      setSuspendReason('');
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge status="success">Active</Badge>;
      case 'pending':
        return <Badge status="warning">Pending</Badge>;
      case 'suspended':
        return <Badge status="danger">Suspended</Badge>;
      case 'rejected':
        return <Badge status="danger">Rejected</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge status="primary">Admin</Badge>;
      case 'vendor':
        return <Badge>Vendor</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getSubscriptionBadge = (subscription) => {
    if (!subscription) return null;
    
    switch (subscription) {
      case 'starter':
        return <Badge>Starter</Badge>;
      case 'professional':
        return <Badge status="primary">Professional</Badge>;
      case 'enterprise':
        return <Badge status="success">Enterprise</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {user.avatar ? (
                  <img className="h-16 w-16 rounded-full" src={user.avatar} alt="" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-xl font-medium text-primary-700">
                      {getInitials(user.name)}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                <p className="text-gray-600">{user.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  {getRoleBadge(user.role)}
                  {getStatusBadge(user.status)}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* User Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">{user.email}</span>
                  {!user.isEmailVerified && (
                    <Badge status="danger" className="ml-2">Unverified</Badge>
                  )}
                </div>
                {user.phone && (
                  <div className="flex items-center">
                    <span className="text-gray-400 mr-3">📱</span>
                    <span className="text-gray-700">{user.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Activity Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <ChartBarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">{user.formsCount} forms created</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 mr-3">📊</span>
                  <span className="text-gray-700">{user.responsesCount} total responses</span>
                </div>
              </div>
            </div>
          </div>

          {/* Business Information */}
          {user.businessName && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Business Information</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BuildingStorefrontIcon className="h-6 w-6 text-gray-400 mr-3" />
                    <span className="font-medium text-gray-900">{user.businessName}</span>
                  </div>
                  {user.subscription && getSubscriptionBadge(user.subscription)}
                </div>
              </div>
            </div>
          )}

          {/* Account Timeline */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Account Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-600">
                  Account created on {formatDate(user.createdAt)}
                </span>
              </div>
              
              {user.lastLoginAt && (
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">
                    Last login on {formatDate(user.lastLoginAt)}
                  </span>
                </div>
              )}

              {user.suspensionReason && (
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">
                    Account suspended
                    <span className="block text-xs text-yellow-600 ml-5 mt-1">
                      Reason: {user.suspensionReason}
                    </span>
                  </span>
                </div>
              )}

              {user.rejectionReason && (
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">
                    Account rejected
                    <span className="block text-xs text-red-600 ml-5 mt-1">
                      Reason: {user.rejectionReason}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Suspend Form */}
          {showSuspendForm && (
            <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
              <h4 className="font-medium text-yellow-900 mb-2">Suspend User</h4>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Please provide a reason for suspension..."
                className="w-full px-3 py-2 border border-yellow-300 rounded-md resize-none"
                rows={3}
              />
              <div className="flex space-x-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSuspendForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSuspend}
                  loading={actionLoading === user.id}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Confirm Suspension
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {user.role !== 'admin' && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end space-x-3">
              {user.status === 'active' && (
                <Button
                  variant="outline"
                  onClick={() => setShowSuspendForm(true)}
                  className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                >
                  <ShieldExclamationIcon className="h-4 w-4 mr-2" />
                  Suspend User
                </Button>
              )}

              {user.status === 'suspended' && (
                <Button
                  onClick={() => onAction(user.id, 'activate')}
                  loading={actionLoading === user.id}
                >
                  <ShieldCheckIcon className="h-4 w-4 mr-2" />
                  Activate User
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => onAction(user.id, 'delete')}
                loading={actionLoading === user.id}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete User
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
