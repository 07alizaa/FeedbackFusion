import { useState, useEffect } from 'react';
import { ChartBarIcon, UserGroupIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/Loading';
import { formsAPI } from '../../lib/api';
import { formatNumber } from '../../lib/utils';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [_forms, setForms] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [formsResponse] = await Promise.all([
        formsAPI.getVendorForms(),
      ]);
      
      // Handle the correct API response structure
      const formsData = Array.isArray(formsResponse?.data?.data?.forms) 
        ? formsResponse.data.data.forms 
        : Array.isArray(formsResponse?.data?.data) 
          ? formsResponse.data.data 
          : [];
      setForms(formsData);
      
      // Generate mock analytics data for demonstration
      const totalResponses = formsData.reduce((sum, form) => sum + (form.entryCount || form.responseCount || 0), 0);
      const avgRating = 4.2;
      const satisfactionRate = 78;
      
      // Mock chart data
      const responsesTrend = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        responses: Math.floor(Math.random() * 50) + 10,
        satisfaction: Math.floor(Math.random() * 20) + 70,
      }));

      const sentimentData = [
        { name: 'Positive', value: 65, color: '#10b981' },
        { name: 'Neutral', value: 25, color: '#f59e0b' },
        { name: 'Negative', value: 10, color: '#ef4444' },
      ];

      const topForms = formsData
        .sort((a, b) => (b.responseCount || 0) - (a.responseCount || 0))
        .slice(0, 5)
        .map(form => ({
          name: form.title.length > 20 ? form.title.substring(0, 20) + '...' : form.title,
          responses: form.responseCount || 0,
        }));

      setAnalyticsData({
        totalResponses,
        avgRating,
        satisfactionRate,
        responsesTrend,
        sentimentData,
        topForms,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner.Page />;
  }

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-gray-600">
          Track performance and insights from your feedback forms
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <Card.Content className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Responses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(analyticsData?.totalResponses || 0)}
              </p>
              <p className="text-sm text-success-600">+12% from last month</p>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Rating</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analyticsData?.avgRating || 0}/5.0
              </p>
              <p className="text-sm text-success-600">+0.3 from last month</p>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Satisfaction Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analyticsData?.satisfactionRate || 0}%
              </p>
              <p className="text-sm text-success-600">+5% from last month</p>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Trends */}
        <Card>
          <Card.Header>
            <Card.Title>Response Trends</Card.Title>
            <Card.Description>Daily responses over the past week</Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData?.responsesTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="responses" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>

        {/* Sentiment Analysis */}
        <Card>
          <Card.Header>
            <Card.Title>Sentiment Analysis</Card.Title>
            <Card.Description>Breakdown of feedback sentiment</Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData?.sentimentData || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData?.sentimentData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>

        {/* Top Performing Forms */}
        <Card>
          <Card.Header>
            <Card.Title>Top Performing Forms</Card.Title>
            <Card.Description>Forms with the most responses</Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData?.topForms || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="responses" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>

        {/* Satisfaction Trends */}
        <Card>
          <Card.Header>
            <Card.Title>Satisfaction Trends</Card.Title>
            <Card.Description>Customer satisfaction over time</Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData?.responsesTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="satisfaction" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <Card.Header>
          <Card.Title>AI Insights</Card.Title>
          <Card.Description>Powered insights from your feedback data</Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
              <h4 className="font-medium text-primary-900">Key Insight</h4>
              <p className="text-sm text-primary-700 mt-1">
                Customer satisfaction has increased by 5% this month, primarily driven by improvements in response time and service quality.
              </p>
            </div>
            <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
              <h4 className="font-medium text-warning-900">Recommendation</h4>
              <p className="text-sm text-warning-700 mt-1">
                Consider adding more specific questions about product features to gather more actionable feedback.
              </p>
            </div>
            <div className="p-4 bg-success-50 rounded-lg border border-success-200">
              <h4 className="font-medium text-success-900">Trend Alert</h4>
              <p className="text-sm text-success-700 mt-1">
                Your forms are performing 23% better than the industry average for response rates.
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default Analytics;
