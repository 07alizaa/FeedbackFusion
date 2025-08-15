import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  QrCodeIcon,
  ShareIcon,
  LinkIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/Loading';
import { formsAPI, qrAPI } from '../../lib/api';
import { formatDate, formatNumber, copyToClipboard } from '../../lib/utils';

const Forms = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [shareModalForm, setShareModalForm] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(false);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await formsAPI.getVendorForms();
      // Handle the correct API response structure
      const formsData = Array.isArray(response?.data?.data?.forms) 
        ? response.data.data.forms 
        : Array.isArray(response?.data?.data) 
          ? response.data.data 
          : [];
      setForms(formsData);
    } catch (error) {
      toast.error('Failed to fetch forms');
      console.error('Error fetching forms:', error);
      setForms([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (formId) => {
    if (!window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(formId);
      await formsAPI.delete(formId);
      // Ensure forms is an array before filtering
      const safeFormsArray = Array.isArray(forms) ? forms : [];
      setForms(safeFormsArray.filter(form => form.id !== formId));
      toast.success('Form deleted successfully');
    } catch (error) {
      toast.error('Failed to delete form');
      console.error('Error deleting form:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleShare = (form) => {
    setShareModalForm(form);
    setQrCode(null); // Reset QR code when opening modal
  };

  const generateQRCode = async (formId) => {
    try {
      setGeneratingQR(true);
      const response = await qrAPI.generate(formId);
      if (response.data.data.qrCodeData) {
        setQrCode(response.data.data.qrCodeData);
        toast.success('QR code generated successfully');
      }
    } catch (error) {
      toast.error('Failed to generate QR code');
      console.error('Error generating QR code:', error);
    } finally {
      setGeneratingQR(false);
    }
  };

  const copyFormLink = async (formId) => {
    const formUrl = `${window.location.origin}/public/forms/${formId}`;
    try {
      await copyToClipboard(formUrl);
      toast.success('Form link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return <LoadingSpinner.Page />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
          <p className="mt-2 text-gray-600">
            Create and manage your feedback forms
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/forms/new">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          </Link>
        </div>
      </div>

      {forms.length === 0 ? (
        <Card>
          <Card.Content>
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No forms yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first feedback form.
              </p>
              <div className="mt-6">
                <Link to="/forms/new">
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Your First Form
                  </Button>
                </Link>
              </div>
            </div>
          </Card.Content>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <Card key={form.id} className="hover:shadow-md transition-shadow">
              <Card.Header>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Card.Title className="text-lg truncate">
                      {form.title}
                    </Card.Title>
                    <Card.Description className="mt-1">
                      Created {formatDate(form.created_at)}
                    </Card.Description>
                  </div>
                  <Badge status={form.isActive ? 'active' : 'inactive'}>
                    {form.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </Card.Header>
              
              <Card.Content>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Responses:</span>
                    <span className="font-medium">
                      {formatNumber(form.responseCount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Fields:</span>
                    <span className="font-medium">
                      {form.config?.fields?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <Badge status={form.status || 'active'} size="sm">
                      {form.status || 'Active'}
                    </Badge>
                  </div>
                </div>
              </Card.Content>

              <Card.Footer>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Link to={`/forms/edit/${form.id}`}>
                      <Button variant="outline" size="sm">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Link to={`/forms/edit/${form.id}`}>
                      <Button variant="outline" size="sm">
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(form)}
                      title="Share form"
                    >
                      <ShareIcon className="h-4 w-4" />
                    </Button>
                    <Link to={`/qr-codes`}>
                      <Button variant="outline" size="sm" title="Manage QR codes">
                        <QrCodeIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(form.id)}
                      loading={deletingId === form.id}
                      disabled={deletingId === form.id}
                      title="Delete form"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card.Footer>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {forms.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title>Quick Stats</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {forms.length}
                </div>
                <div className="text-sm text-gray-500">Total Forms</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success-600">
                  {forms.filter(form => form.isActive).length}
                </div>
                <div className="text-sm text-gray-500">Active Forms</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning-600">
                  {forms.reduce((sum, form) => sum + (form.responseCount || 0), 0)}
                </div>
                <div className="text-sm text-gray-500">Total Responses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {forms.length > 0 ? Math.round(
                    forms.reduce((sum, form) => sum + (form.responseCount || 0), 0) / forms.length
                  ) : 0}
                </div>
                <div className="text-sm text-gray-500">Avg. Responses</div>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Share Modal */}
      {shareModalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Share Form: {shareModalForm.title}</h3>
              <button
                onClick={() => setShareModalForm(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Form Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Form Link
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={`${window.location.origin}/public/forms/${shareModalForm.id}`}
                    readOnly
                    className="flex-1 p-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                  />
                  <Button
                    onClick={() => copyFormLink(shareModalForm.id)}
                    variant="outline"
                    className="rounded-l-none border-l-0"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* QR Code */}
              {qrCode && (
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QR Code
                  </label>
                  <div className="inline-block p-4 bg-white border rounded-lg">
                    <img src={qrCode} alt="QR Code" className="max-w-[200px] h-auto" />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShareModalForm(null)}
                >
                  Close
                </Button>
                {!qrCode && (
                  <Button
                    onClick={() => generateQRCode(shareModalForm.id)}
                    loading={generatingQR}
                  >
                    Generate QR Code
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forms;
