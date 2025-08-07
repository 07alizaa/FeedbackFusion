import { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  BuildingStorefrontIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/Loading';
import { adminAPI } from '../../lib/api';
import { formatNumber, formatCurrency } from '../../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, activityRes, analyticsRes, approvalsRes] = await Promise.all([
        adminAPI.getStats().catch(() => ({ data: { data: null } })),
        adminAPI.getRecentActivity().catch(() => ({ data: { data: [] } })),
        adminAPI.getAnalytics().catch(() => ({ data: { data: null } })),
        adminAPI.getPendingApprovals().catch(() => ({ data: { data: [] } })),
      ]);

      setStats(statsRes.data.data || getMockStats());
      setRecentActivity(activityRes.data.data || getMockActivity());
      setAnalytics(analyticsRes.data.data || getMockAnalytics());
      setPendingApprovals(approvalsRes.data.data || getMockApprovals());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Load mock data on error
      setStats(getMockStats());
      setRecentActivity(getMockActivity());
      setAnalytics(getMockAnalytics());
      setPendingApprovals(getMockApprovals());
    } finally {
      setLoading(false);
    }
  };

  const getMockStats = () => ({
    totalUsers: 1247,
    activeBusinesses: 342,
    totalForms: 2156,
    totalResponses: 12540,
    revenue: 15420,
    growth: {
      users: 12.5,
      businesses: 8.3,
      forms: 15.2,
      responses: 22.1,
      revenue: 18.7,
    },
  });

  const getMockActivity = () => [
    {
      id: 1,
      type: 'user_signup',
      description: 'New user registration: john@example.com',
      timestamp: '2024-01-15T10:30:00Z',
      user: 'john@example.com',
    },
    {
      id: 2,
      type: 'business_approved',
      description: 'Business approved: TechCorp Solutions',
      timestamp: '2024-01-15T09:15:00Z',
      business: 'TechCorp Solutions',
    },
    {
      id: 3,
      type: 'form_created',
      description: 'New form created: Customer Satisfaction Survey',
      timestamp: '2024-01-15T08:45:00Z',
      form: 'Customer Satisfaction Survey',
    },
    {
      id: 4,
      type: 'subscription_upgrade',
      description: 'Subscription upgraded to Professional',
      timestamp: '2024-01-15T07:20:00Z',
      user: 'sarah@company.com',
    },
    {
      id: 5,
      type: 'issue_reported',
      description: 'Support ticket created: Form submission error',
      timestamp: '2024-01-15T06:30:00Z',
      priority: 'high',
    },
  ];

  const getMockAnalytics = () => ({
    userGrowth: [
      { month: 'Jan', users: 850, businesses: 120 },
      { month: 'Feb', users: 920, businesses: 135 },
      { month: 'Mar', users: 1050, businesses: 158 },
      { month: 'Apr', users: 1180, businesses: 187 },
      { month: 'May', users: 1247, businesses: 212 },
      { month: 'Jun', users: 1420, businesses: 245 },
    ],
    subscriptionDistribution: [
      { name: 'Starter', value: 65, color: '#8884d8' },
      { name: 'Professional', value: 28, color: '#82ca9d' },
      { name: 'Enterprise', value: 7, color: '#ffc658' },
    ],
    topBusinesses: [
      { name: 'TechCorp Solutions', forms: 45, responses: 1250 },
      { name: 'Digital Dynamics', forms: 38, responses: 980 },
      { name: 'Innovation Labs', forms: 32, responses: 875 },
      { name: 'Smart Systems', forms: 28, responses: 720 },
      { name: 'Future Works', forms: 25, responses: 650 },
    ],
  });

  const getMockApprovals = () => [
    {
      id: 1,
      businessName: 'NextGen Solutions',
      ownerName: 'Michael Johnson',
      email: 'michael@nextgen.com',
      phone: '+1-555-0123',
      website: 'https://nextgen.com',
      description: 'Software development and consulting services',
      submittedAt: '2024-01-14T15:30:00Z',
      documents: ['business_license.pdf', 'tax_certificate.pdf'],
    },
    {
      id: 2,
      businessName: 'Green Earth Consultancy',
      ownerName: 'Sarah Williams',
      email: 'sarah@greenearth.com',
      phone: '+1-555-0456',
      website: 'https://greenearth.com',
      description: 'Environmental consulting and sustainability services',
      submittedAt: '2024-01-13T11:45:00Z',
      documents: ['business_license.pdf'],
    },
    {
      id: 3,
      businessName: 'Culinary Creations',
      ownerName: 'Chef Antonio Rodriguez',
      email: 'antonio@culinary.com',
      phone: '+1-555-0789',
      website: 'https://culinarycreations.com',
      description: 'Restaurant and catering services',
      submittedAt: '2024-01-12T16:20:00Z',
      documents: ['business_license.pdf', 'health_permit.pdf', 'insurance.pdf'],
    },
  ];

  const handleApproval = async (businessId, action) => {
    try {
      if (action === 'approve') {
        await adminAPI.approveBusiness(businessId);
      } else {
        await adminAPI.rejectBusiness(businessId);
      }
      // Refresh data
      fetchDashboardData();
    } catch (error) {
      console.error('Error handling approval:', error);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_signup':
        return <UsersIcon className="h-5 w-5 text-blue-500" />;
      case 'business_approved':
        return <BuildingStorefrontIcon className="h-5 w-5 text-green-500" />;
      case 'form_created':
        return <DocumentTextIcon className="h-5 w-5 text-purple-500" />;
      case 'subscription_upgrade':
        return <ChartBarIcon className="h-5 w-5 text-yellow-500" />;
      case 'issue_reported':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActivityBadge = (type, priority) => {
    if (priority === 'high') {
      return <Badge status="danger">High Priority</Badge>;
    }
    
    switch (type) {
      case 'user_signup':
        return <Badge status="info">New User</Badge>;
      case 'business_approved':
        return <Badge status="success">Approved</Badge>;
      case 'form_created':
        return <Badge status="primary">New Form</Badge>;
      case 'subscription_upgrade':
        return <Badge status="warning">Upgrade</Badge>;
      case 'issue_reported':
        return <Badge status="danger">Issue</Badge>;
      default:
        return <Badge>Activity</Badge>;
    }
  };

  if (loading) {
    return <LoadingSpinner.Page />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of platform activity and business management
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Users
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatNumber(stats?.totalUsers || 0)}
                    </div>
                    {stats?.growth?.users && (
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        +{stats.growth.users}%
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingStorefrontIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Businesses
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatNumber(stats?.activeBusinesses || 0)}
                    </div>
                    {stats?.growth?.businesses && (
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        +{stats.growth.businesses}%
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Forms
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatNumber(stats?.totalForms || 0)}
                    </div>
                    {stats?.growth?.forms && (
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        +{stats.growth.forms}%
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Responses
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatNumber(stats?.totalResponses || 0)}
                    </div>
                    {stats?.growth?.responses && (
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        +{stats.growth.responses}%
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Monthly Revenue
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(stats?.revenue || 0)}
                    </div>
                    {stats?.growth?.revenue && (
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        +{stats.growth.revenue}%
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Charts Row */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <Card>
            <Card.Header>
              <Card.Title>User & Business Growth</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Users"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="businesses" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Businesses"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Content>
          </Card>

          {/* Subscription Distribution */}
          <Card>
            <Card.Header>
              <Card.Title>Subscription Distribution</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.subscriptionDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.subscriptionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card.Content>
          </Card>
        </div>
      )}

      {/* Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <Card>
          <Card.Header className="flex flex-row items-center justify-between">
            <Card.Title>Pending Business Approvals</Card.Title>
            <Badge>{pendingApprovals.length}</Badge>
          </Card.Header>
          <Card.Content>
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircleIcon className="h-12 w-12 mx-auto mb-4 text-green-400" />
                <p>No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.slice(0, 3).map((business) => (
                  <div key={business.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{business.businessName}</h4>
                        <p className="text-sm text-gray-600">{business.ownerName}</p>
                        <p className="text-sm text-gray-500">{business.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Submitted {new Date(business.submittedAt).toLocaleDateString()}
                        </p>
                        <div className="flex items-center mt-2 space-x-2">
                          <EyeIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {business.documents.length} documents
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => handleApproval(business.id, 'reject')}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApproval(business.id, 'approve')}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingApprovals.length > 3 && (
                  <div className="text-center">
                    <Button variant="outline" size="sm">
                      View All ({pendingApprovals.length - 3} more)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Recent Activity */}
        <Card>
          <Card.Header>
            <Card.Title>Recent Activity</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              {recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {getActivityBadge(activity.type, activity.priority)}
                  </div>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Top Businesses */}
      {analytics?.topBusinesses && (
        <Card>
          <Card.Header>
            <Card.Title>Top Performing Businesses</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topBusinesses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="forms" fill="#3B82F6" name="Forms" />
                  <Bar dataKey="responses" fill="#10B981" name="Responses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
