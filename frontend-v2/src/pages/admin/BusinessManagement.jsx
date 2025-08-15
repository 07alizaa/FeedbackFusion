import { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingStorefrontIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  FunnelIcon,
  ChartBarIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/Loading';
import { adminAPI } from '../../lib/api';

// Helper functions moved outside components to be accessible everywhere
const getStatusBadge = (status) => {
  switch (status) {
    case 'approved':
      return <Badge status="success">Approved</Badge>;
    case 'pending':
      return <Badge status="warning">Pending</Badge>;
    case 'rejected':
      return <Badge status="danger">Rejected</Badge>;
    case 'suspended':
      return <Badge status="danger">Suspended</Badge>;
    default:
      return <Badge>Unknown</Badge>;
  }
};

const getSubscriptionBadge = (subscription) => {
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

const BusinessManagement = () => {
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const filterBusinesses = useCallback(() => {
    let filtered = [...businesses];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(business =>
        business.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(business => business.status === statusFilter);
    }

    setFilteredBusinesses(filtered);
  }, [businesses, searchTerm, statusFilter]);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    filterBusinesses();
  }, [filterBusinesses]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getBusinesses();
      const businessData = response.data.data || [];
      setBusinesses(businessData);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      // Show empty array on error instead of mock data
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (businessId, action, reason = null) => {
    try {
      setActionLoading(businessId);
      
      switch (action) {
        case 'approve':
          await adminAPI.approveBusiness(businessId);
          break;
        case 'reject':
          await adminAPI.rejectBusiness(businessId, reason);
          break;
        case 'suspend':
          await adminAPI.suspendBusiness(businessId, reason);
          break;
        case 'reactivate':
          await adminAPI.reactivateBusiness(businessId);
          break;
        default:
          throw new Error('Invalid action');
      }

      // Refresh businesses
      await fetchBusinesses();
      setSelectedBusiness(null);
    } catch (error) {
      console.error(`Error ${action}ing business:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <LoadingSpinner.Page />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Management</h1>
          <p className="mt-2 text-gray-600">
            Manage business registrations and approvals
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge>{filteredBusinesses.length} businesses</Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <Card.Content className="p-4">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search businesses, owners, or emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Business Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredBusinesses.map((business) => (
          <Card key={business.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <Card.Header>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <BuildingStorefrontIcon className="h-8 w-8 text-gray-400" />
                  <div>
                    <Card.Title className="text-lg">{business.businessName}</Card.Title>
                    <p className="text-sm text-gray-600">{business.ownerName}</p>
                  </div>
                </div>
                {getStatusBadge(business.status)}
              </div>
            </Card.Header>

            <Card.Content>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  {business.email}
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  {business.phone || 'Not provided'}
                </div>

                {business.website && (
                  <div className="flex items-center text-sm text-gray-600">
                    <GlobeAltIcon className="h-4 w-4 mr-2" />
                    <a 
                      href={business.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-800"
                    >
                      Website
                    </a>
                  </div>
                )}

                <p className="text-sm text-gray-700 line-clamp-2">
                  {business.description || 'No description provided'}
                </p>

                <div className="flex justify-between items-center pt-2">
                  <div className="flex space-x-4 text-xs text-gray-500">
                    <span>{business.formsCount || 0} forms</span>
                    <span>{business.responsesCount || 0} responses</span>
                  </div>
                  {getSubscriptionBadge(business.subscription || 'starter')}
                </div>

                <div className="text-xs text-gray-500">
                  <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                  Submitted {new Date(business.submittedAt).toLocaleDateString()}
                </div>
              </div>
            </Card.Content>

            <Card.Footer>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBusiness(business)}
                  className="flex-1"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View
                </Button>
                
                {business.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleAction(business.id, 'approve')}
                      loading={actionLoading === business.id}
                      className="flex-1"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </>
                )}

                {business.status === 'approved' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction(business.id, 'suspend', 'Manual suspension')}
                    loading={actionLoading === business.id}
                    className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircleIcon className="h-4 w-4 mr-1" />
                    Suspend
                  </Button>
                )}

                {business.status === 'suspended' && (
                  <Button
                    size="sm"
                    onClick={() => handleAction(business.id, 'reactivate')}
                    loading={actionLoading === business.id}
                    className="flex-1"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Reactivate
                  </Button>
                )}
              </div>
            </Card.Footer>
          </Card>
        ))}
      </div>

      {filteredBusinesses.length === 0 && (
        <Card>
          <Card.Content className="p-12 text-center">
            <BuildingStorefrontIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No businesses found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria or filters.'
                : 'No businesses have been registered yet.'
              }
            </p>
          </Card.Content>
        </Card>
      )}

      {/* Business Detail Modal */}
      {selectedBusiness && (
        <BusinessDetailModal
          business={selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
          onAction={handleAction}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
};

// Business Detail Modal Component
const BusinessDetailModal = ({ business, onClose, onAction, actionLoading }) => {
  const [rejectReason, setRejectReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showSuspendForm, setShowSuspendForm] = useState(false);

  const handleReject = () => {
    if (rejectReason.trim()) {
      onAction(business.id, 'reject', rejectReason);
      setShowRejectForm(false);
      setRejectReason('');
    }
  };

  const handleSuspend = () => {
    if (suspendReason.trim()) {
      onAction(business.id, 'suspend', suspendReason);
      setShowSuspendForm(false);
      setSuspendReason('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{business.businessName}</h2>
              <p className="text-gray-600">{business.ownerName}</p>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(business.status)}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Business Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">{business.email}</span>
                </div>
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">{business.phone || 'Not provided'}</span>
                </div>
                {business.website && (
                  <div className="flex items-center">
                    <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <a 
                      href={business.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-800"
                    >
                      {business.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Business Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">{business.formsCount || 0} forms created</span>
                </div>
                <div className="flex items-center">
                  <ChartBarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">{business.responsesCount || 0} total responses</span>
                </div>
                <div className="flex items-center">
                  <CreditCardIcon className="h-5 w-5 text-gray-400 mr-3" />
                  {getSubscriptionBadge(business.subscription || 'starter')}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
            <p className="text-gray-700">{business.description || 'No description provided'}</p>
          </div>

          {/* Documents */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Documents</h3>
            <div className="space-y-2">
              {business.documents && business.documents.length > 0 ? (
                business.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-700">{doc.name}</span>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <DocumentTextIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No documents uploaded</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-600">
                  Submitted on {new Date(business.submittedAt).toLocaleString()}
                </span>
              </div>
              
              {business.approvedAt && (
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">
                    Approved on {new Date(business.approvedAt).toLocaleString()}
                  </span>
                </div>
              )}

              {business.rejectedAt && (
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">
                    Rejected on {new Date(business.rejectedAt).toLocaleString()}
                    {business.rejectionReason && (
                      <span className="block text-xs text-red-600 ml-5 mt-1">
                        Reason: {business.rejectionReason}
                      </span>
                    )}
                  </span>
                </div>
              )}

              {business.suspendedAt && (
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">
                    Suspended on {new Date(business.suspendedAt).toLocaleString()}
                    {business.suspensionReason && (
                      <span className="block text-xs text-yellow-600 ml-5 mt-1">
                        Reason: {business.suspensionReason}
                      </span>
                    )}
                  </span>
                </div>
              )}

              {business.lastActive && (
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-gray-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">
                    Last active on {new Date(business.lastActive).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Reject Form */}
          {showRejectForm && (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <h4 className="font-medium text-red-900 mb-2">Reject Business</h4>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="w-full px-3 py-2 border border-red-300 rounded-md resize-none"
                rows={3}
              />
              <div className="flex space-x-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRejectForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleReject}
                  loading={actionLoading === business.id}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          )}

          {/* Suspend Form */}
          {showSuspendForm && (
            <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
              <h4 className="font-medium text-yellow-900 mb-2">Suspend Business</h4>
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
                  loading={actionLoading === business.id}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Confirm Suspension
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            {business.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectForm(true)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => onAction(business.id, 'approve')}
                  loading={actionLoading === business.id}
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}

            {business.status === 'approved' && (
              <Button
                variant="outline"
                onClick={() => setShowSuspendForm(true)}
                className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
              >
                <ExclamationCircleIcon className="h-4 w-4 mr-2" />
                Suspend
              </Button>
            )}

            {business.status === 'suspended' && (
              <Button
                onClick={() => onAction(business.id, 'reactivate')}
                loading={actionLoading === business.id}
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Reactivate
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessManagement;
