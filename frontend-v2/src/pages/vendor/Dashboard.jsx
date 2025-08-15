import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChartBarIcon,
  DocumentTextIcon,
  EyeIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/Loading';
import { formsAPI } from '../../lib/api';
import { formatNumber, formatDate } from '../../lib/utils';

const Dashboard = () => {
  const [forms, setForms] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [formsResponse] = await Promise.all([
          formsAPI.getVendorForms(),
        ]);
        
        // Handle the correct API response structure
        // API returns: { success: true, data: { forms: [...], totalForms: 5 } }
        const formsData = Array.isArray(formsResponse?.data?.data?.forms) 
          ? formsResponse.data.data.forms 
          : Array.isArray(formsResponse?.data?.data) 
            ? formsResponse.data.data 
            : [];
        
        setForms(formsData);
        
        // Calculate basic stats from forms
        const totalForms = formsData.length;
        const activeForms = formsData.filter(form => form.isActive || form.is_active).length;
        const totalResponses = formsData.reduce((sum, form) => sum + (form.entryCount || form.responses_count || form.responseCount || 0), 0);
        
        setStats({
          totalForms,
          activeForms,
          totalResponses,
          responseRate: totalForms > 0 ? Math.round((totalResponses / totalForms) * 100) : 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set empty state on error
        setForms([]);
        setStats({
          totalForms: 0,
          activeForms: 0,
          totalResponses: 0,
          responseRate: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner.Page />;
  }

  // Ensure forms is always an array before using array methods
  const safeFormsArray = Array.isArray(forms) ? forms : [];
  const recentForms = safeFormsArray.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-sm">
        <div className="px-6 py-8 text-white">
          <h1 className="text-2xl font-bold">Welcome back!</h1>
          <p className="mt-2 text-primary-100">
            Here's what's happening with your feedback forms today.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <Card.Content className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Forms</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(stats?.totalForms || 0)}
              </p>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Forms</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(stats?.activeForms || 0)}
              </p>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Responses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(stats?.totalResponses || 0)}
              </p>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Response Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.responseRate || 0}%
              </p>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <Card.Header>
          <Card.Title>Quick Actions</Card.Title>
          <Card.Description>
            Get started with these common tasks
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/forms/new">
              <Button className="w-full h-20 flex-col">
                <PlusIcon className="h-6 w-6 mb-2" />
                Create New Form
              </Button>
            </Link>
            <Link to="/forms">
              <Button variant="outline" className="w-full h-20 flex-col">
                <DocumentTextIcon className="h-6 w-6 mb-2" />
                Manage Forms
              </Button>
            </Link>
            <Link to="/analytics">
              <Button variant="outline" className="w-full h-20 flex-col">
                <ChartBarIcon className="h-6 w-6 mb-2" />
                View Analytics
              </Button>
            </Link>
          </div>
        </Card.Content>
      </Card>

      {/* Recent Forms */}
      <Card>
        <Card.Header className="flex flex-row items-center justify-between">
          <div>
            <Card.Title>Recent Forms</Card.Title>
            <Card.Description>
              Your latest feedback forms
            </Card.Description>
          </div>
          <Link to="/forms">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </Card.Header>
        <Card.Content>
          {recentForms.length === 0 ? (
            <div className="text-center py-6">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No forms yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first feedback form.
              </p>
              <div className="mt-6">
                <Link to="/forms/new">
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Form
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentForms.map((form) => (
                <div
                  key={form.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {form.title}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Created {formatDate(form.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge status={form.isActive ? 'active' : 'inactive'}>
                      {form.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {form.responseCount || 0} responses
                    </span>
                    <Link to={`/forms/${form.id}`}>
                      <Button variant="outline" size="sm">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      {/* AI Insights Preview */}
      <Card>
        <Card.Header>
          <Card.Title>AI Insights</Card.Title>
          <Card.Description>
            Powered insights from your feedback data
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="text-center py-6">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">AI Analysis</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get detailed insights once you have collected feedback responses.
            </p>
            <div className="mt-6">
              <Link to="/analytics">
                <Button variant="outline">
                  View Analytics
                </Button>
              </Link>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default Dashboard;
