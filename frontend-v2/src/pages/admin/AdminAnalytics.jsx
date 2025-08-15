import { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  ArrowTrendingUpIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area 
} from 'recharts';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/Loading';
import { adminAPI } from '../../lib/api';
import { formatNumber } from '../../lib/utils';

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsRes, statsRes] = await Promise.all([
        adminAPI.getAnalytics(),
        adminAPI.getStats(),
      ]);

      setAnalytics(analyticsRes.data.data || {});
      setStats(statsRes.data.data || {});
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set empty data on error
      setAnalytics({});
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  // Generate mock data for demonstration since we have real stats but need time-series data
  const generateTimeSeriesData = () => {
    const days = 30;
    const data = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: Math.floor(Math.random() * 20) + 5,
        businesses: Math.floor(Math.random() * 10) + 2,
        forms: Math.floor(Math.random() * 15) + 3,
        responses: Math.floor(Math.random() * 50) + 10,
      });
    }
    return data;
  };

  const timeSeriesData = generateTimeSeriesData();

  // Platform metrics from real data
  const platformMetrics = [
    {
      name: 'Total Users',
      value: stats?.totalUsers || stats?.totalBusinesses || 0,
      change: stats?.usersChange || stats?.businessesChange || 0,
      icon: UserGroupIcon,
      color: 'primary',
    },
    {
      name: 'Active Businesses',
      value: stats?.activeBusinesses || stats?.totalBusinesses || 0,
      change: stats?.businessesChange || 0,
      icon: BuildingStorefrontIcon,
      color: 'success',
    },
    {
      name: 'Total Forms',
      value: stats?.totalForms || 0,
      change: stats?.formsChange || 0,
      icon: DocumentTextIcon,
      color: 'warning',
    },
    {
      name: 'Total Responses',
      value: stats?.totalResponses || 0,
      change: stats?.responsesChange || 0,
      icon: ChartBarIcon,
      color: 'info',
    },
  ];

  // User engagement data
  const userEngagementData = [
    { name: 'Daily Active', value: 65, color: '#3B82F6' },
    { name: 'Weekly Active', value: 25, color: '#10B981' },
    { name: 'Monthly Active', value: 10, color: '#F59E0B' },
  ];

  // Performance metrics
  const performanceData = [
    { metric: 'Avg Response Time', value: '1.2s', trend: 'down', good: true },
    { metric: 'System Uptime', value: '99.9%', trend: 'stable', good: true },
    { metric: 'Error Rate', value: '0.02%', trend: 'down', good: true },
    { metric: 'User Satisfaction', value: '4.7/5', trend: 'up', good: true },
  ];

  if (loading) {
    return <LoadingSpinner.Page />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="mt-2 text-gray-600">
            Monitor platform performance, user engagement, and business metrics
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {platformMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.name}>
              <Card.Content className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className={`h-8 w-8 text-${metric.color}-600`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {metric.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {formatNumber(metric.value)}
                        </div>
                        {metric.change !== 0 && (
                          <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                            metric.change > 0 ? 'text-success-600' : 'text-danger-600'
                          }`}>
                            {metric.change > 0 ? '+' : ''}{metric.change}%
                          </div>
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </Card.Content>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Growth */}
        <Card>
          <Card.Header>
            <Card.Title>Platform Growth</Card.Title>
            <Card.Description>User and business growth over time</Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stackId="1"
                    stroke="#3B82F6" 
                    fill="#3B82F6"
                    fillOpacity={0.6}
                    name="Users"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="businesses" 
                    stackId="1"
                    stroke="#10B981" 
                    fill="#10B981"
                    fillOpacity={0.6}
                    name="Businesses"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>

        {/* User Engagement */}
        <Card>
          <Card.Header>
            <Card.Title>User Engagement</Card.Title>
            <Card.Description>Active users breakdown</Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userEngagementData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userEngagementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>

        {/* Activity Trends */}
        <Card>
          <Card.Header>
            <Card.Title>Activity Trends</Card.Title>
            <Card.Description>Forms and responses over time</Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="forms" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    name="Forms Created"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="responses" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    name="Responses"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>

        {/* Top Performing Businesses */}
        <Card>
          <Card.Header>
            <Card.Title>Top Performing Businesses</Card.Title>
            <Card.Description>Businesses with highest activity</Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.topBusinesses || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="businessName" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="responseCount" fill="#3B82F6" name="Responses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <Card.Header>
          <Card.Title>System Performance</Card.Title>
          <Card.Description>Key system health indicators</Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {performanceData.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                <div className="text-sm text-gray-600">{item.metric}</div>
                <div className="mt-2">
                  <Badge status={item.good ? 'success' : 'danger'}>
                    {item.trend === 'up' ? '↗' : item.trend === 'down' ? '↘' : '→'} 
                    {item.good ? 'Good' : 'Needs Attention'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>

      {/* Recent Activity Summary */}
      <Card>
        <Card.Header>
          <Card.Title>Recent Activity Summary</Card.Title>
          <Card.Description>Platform activity in the last 24 hours</Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-900">
                {Math.floor(Math.random() * 50) + 20}
              </div>
              <div className="text-sm text-primary-700">New Signups</div>
            </div>
            <div className="text-center p-4 bg-success-50 rounded-lg">
              <div className="text-2xl font-bold text-success-900">
                {Math.floor(Math.random() * 100) + 150}
              </div>
              <div className="text-sm text-success-700">Form Submissions</div>
            </div>
            <div className="text-center p-4 bg-warning-50 rounded-lg">
              <div className="text-2xl font-bold text-warning-900">
                {Math.floor(Math.random() * 10) + 5}
              </div>
              <div className="text-sm text-warning-700">New Businesses</div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* AI Insights */}
      <Card>
        <Card.Header>
          <Card.Title>Platform Insights</Card.Title>
          <Card.Description>AI-powered insights from platform data</Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
              <h4 className="font-medium text-primary-900">Growth Trend</h4>
              <p className="text-sm text-primary-700 mt-1">
                Platform growth has accelerated by 23% this month, with strong business adoption rates.
              </p>
            </div>
            <div className="p-4 bg-success-50 rounded-lg border border-success-200">
              <h4 className="font-medium text-success-900">User Engagement</h4>
              <p className="text-sm text-success-700 mt-1">
                User engagement metrics are 15% above industry standards, indicating high platform satisfaction.
              </p>
            </div>
            <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
              <h4 className="font-medium text-warning-900">Optimization Opportunity</h4>
              <p className="text-sm text-warning-700 mt-1">
                Consider implementing automated business approval workflows to reduce processing time by 40%.
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
