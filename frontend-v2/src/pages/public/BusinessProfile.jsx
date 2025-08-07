import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPinIcon,
  PhoneIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  StarIcon,
  QrCodeIcon,
  DocumentTextIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/Loading';
import { publicAPI } from '../../lib/api';

const BusinessProfile = () => {
  const { businessId } = useParams();
  const [business, setBusiness] = useState(null);
  const [forms, setForms] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBusinessData();
  }, [businessId]);

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      const [businessRes, formsRes, statsRes] = await Promise.all([
        publicAPI.getBusiness(businessId),
        publicAPI.getBusinessForms(businessId),
        publicAPI.getBusinessStats(businessId).catch(() => ({ data: { data: null } })),
      ]);
      
      setBusiness(businessRes.data.data);
      setForms(formsRes.data.data);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Error fetching business data:', error);
      setError('Business not found or no longer available');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`h-5 w-5 ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">
          ({rating.toFixed(1)})
        </span>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner.Page />;
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 p-8 text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Business Not Found</h1>
          <p className="text-gray-600 mb-6">
            The business you're looking for doesn't exist or is no longer available.
          </p>
          <Link to="/">
            <Button>Return Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="text-xl font-bold text-gray-900">FeedbackFusion</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-gray-900">
                Business Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Business Header */}
        <Card className="mb-8">
          <div className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              {business.logo && (
                <img 
                  src={business.logo} 
                  alt={business.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {business.name}
                    </h1>
                    <p className="text-lg text-gray-600 mb-4">
                      {business.description}
                    </p>
                    {stats?.averageRating && (
                      <div className="mb-4">
                        {renderStars(stats.averageRating)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Badge 
                      status={business.status === 'active' ? 'success' : 'warning'}
                    >
                      {business.status === 'active' ? 'Active' : 'Pending'}
                    </Badge>
                    <Badge variant="outline">
                      {business.category || 'General'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Business Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact Information */}
            <Card>
              <Card.Header>
                <Card.Title>Contact Information</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  {business.address && (
                    <div className="flex items-start space-x-3">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-900">{business.address}</p>
                        {business.city && business.state && (
                          <p className="text-gray-600">
                            {business.city}, {business.state} {business.zipCode}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {business.phone && (
                    <div className="flex items-center space-x-3">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                      <a 
                        href={`tel:${business.phone}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {business.phone}
                      </a>
                    </div>
                  )}
                  
                  {business.email && (
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      <a 
                        href={`mailto:${business.email}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {business.email}
                      </a>
                    </div>
                  )}
                  
                  {business.website && (
                    <div className="flex items-center space-x-3">
                      <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                      <a 
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {business.website}
                      </a>
                    </div>
                  )}
                </div>
              </Card.Content>
            </Card>

            {/* Feedback Forms */}
            <Card>
              <Card.Header>
                <Card.Title>Share Your Feedback</Card.Title>
              </Card.Header>
              <Card.Content>
                {forms.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No feedback forms available at this time.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {forms.map((form) => (
                      <Card key={form.id} className="border border-gray-200">
                        <Card.Content className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 mb-1">
                                {form.title}
                              </h3>
                              {form.description && (
                                <p className="text-sm text-gray-600 mb-3">
                                  {form.description}
                                </p>
                              )}
                              <div className="flex items-center text-xs text-gray-500">
                                <DocumentTextIcon className="h-4 w-4 mr-1" />
                                {form.fields?.length || 0} questions
                              </div>
                            </div>
                            {form.qrCode && (
                              <QrCodeIcon className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <Link to={`/form/${businessId}/${form.id}`}>
                            <Button size="sm" className="w-full">
                              Fill Out Form
                            </Button>
                          </Link>
                        </Card.Content>
                      </Card>
                    ))}
                  </div>
                )}
              </Card.Content>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Business Stats */}
            {stats && (
              <Card>
                <Card.Header>
                  <Card.Title>Business Insights</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-4">
                    {stats.totalResponses && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total Feedback</span>
                        <span className="font-semibold">
                          {stats.totalResponses.toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    {stats.averageRating && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Average Rating</span>
                        <span className="font-semibold">
                          {stats.averageRating.toFixed(1)}/5
                        </span>
                      </div>
                    )}
                    
                    {stats.responseRate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Response Rate</span>
                        <span className="font-semibold">
                          {stats.responseRate}%
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Active Forms</span>
                      <span className="font-semibold">{forms.length}</span>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            )}

            {/* Business Hours */}
            {business.hours && (
              <Card>
                <Card.Header>
                  <Card.Title>Business Hours</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-2">
                    {Object.entries(business.hours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{day}</span>
                        <span className="font-medium">{hours}</span>
                      </div>
                    ))}
                  </div>
                </Card.Content>
              </Card>
            )}

            {/* Call to Action */}
            <Card className="bg-primary-50 border-primary-200">
              <Card.Content className="p-6 text-center">
                <ChartBarIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Own a Business?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Create your own feedback forms and start collecting valuable customer insights.
                </p>
                <Link to="/signup">
                  <Button size="sm" className="w-full">
                    Get Started Free
                  </Button>
                </Link>
              </Card.Content>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>
              Powered by{' '}
              <Link to="/" className="text-primary-600 hover:text-primary-700 font-medium">
                FeedbackFusion
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BusinessProfile;
