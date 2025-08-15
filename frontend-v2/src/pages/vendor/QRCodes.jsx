import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  QrCodeIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/Loading';
import { qrAPI, formsAPI } from '../../lib/api';
import { copyToClipboard, downloadFile, generateFormUrl } from '../../lib/utils';

const QRCodes = () => {
  const [qrCodes, setQrCodes] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qrResponse, formsResponse] = await Promise.all([
        qrAPI.getAll(),
        formsAPI.getVendorForms(),
      ]);
      
      setQrCodes(qrResponse.data.data || []);
      // Handle the correct API response structure for forms
      const formsData = Array.isArray(formsResponse?.data?.data?.forms) 
        ? formsResponse.data.data.forms 
        : Array.isArray(formsResponse?.data?.data) 
          ? formsResponse.data.data 
          : [];
      setForms(formsData);
    } catch (error) {
      toast.error('Failed to fetch QR codes');
      console.error('Error fetching QR codes:', error);
      setQrCodes([]);
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async (formId) => {
    try {
      setGeneratingId(formId);
      await qrAPI.generate(formId);
      await fetchData(); // Refresh the list
      toast.success('QR code generated successfully');
    } catch (error) {
      toast.error('Failed to generate QR code');
      console.error('Error generating QR code:', error);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleCopyUrl = async (formId) => {
    const url = generateFormUrl(formId);
    try {
      await copyToClipboard(url);
      toast.success('URL copied to clipboard');
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  const handleDownloadQR = async (formId) => {
    try {
      const response = await qrAPI.download(formId);
      const blob = new Blob([response.data], { type: 'image/png' });
      downloadFile(blob, `qr-code-form-${formId}.png`);
      toast.success('QR code downloaded');
    } catch (error) {
      toast.error('Failed to download QR code');
      console.error('Error downloading QR code:', error);
    }
  };

  const formsWithoutQR = forms.filter(
    form => !qrCodes.some(qr => qr.formId === form.id)
  );

  if (loading) {
    return <LoadingSpinner.Page />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">QR Codes</h1>
        <p className="mt-2 text-gray-600">
          Generate and manage QR codes for your feedback forms
        </p>
      </div>

      {/* Generate QR for forms without QR */}
      {formsWithoutQR.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title>Generate QR Codes</Card.Title>
            <Card.Description>
              Create QR codes for forms that don't have them yet
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formsWithoutQR.map((form) => (
                <div
                  key={form.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <h4 className="font-medium text-gray-900 truncate">
                    {form.title}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {form.responseCount || 0} responses
                  </p>
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => handleGenerateQR(form.id)}
                    loading={generatingId === form.id}
                    disabled={generatingId === form.id}
                  >
                    <QrCodeIcon className="h-4 w-4 mr-2" />
                    Generate QR Code
                  </Button>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Existing QR Codes */}
      {qrCodes.length === 0 ? (
        <Card>
          <Card.Content>
            <div className="text-center py-12">
              <QrCodeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No QR codes yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Generate QR codes for your forms to make them easily accessible.
              </p>
            </div>
          </Card.Content>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qrCodes.map((qrCode, index) => {
            const formUrl = generateFormUrl(qrCode.formId);

            return (
              <Card key={qrCode.formId || index} className="hover:shadow-md transition-shadow">
                <Card.Header>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Card.Title className="text-lg truncate">
                        {qrCode.formTitle || 'Unknown Form'}
                      </Card.Title>
                      <Card.Description>
                        Form ID: {qrCode.formId}
                      </Card.Description>
                    </div>
                    <Badge status={qrCode.isActive ? 'active' : 'inactive'}>
                      {qrCode.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </Card.Header>

                <Card.Content>
                  <div className="space-y-4">
                    {/* QR Code Display */}
                    <div className="flex justify-center">
                      <div className="p-4 bg-white border border-gray-200 rounded-lg">
                        {qrCode.qrCodeDataUrl ? (
                          <img 
                            src={qrCode.qrCodeDataUrl} 
                            alt="QR Code" 
                            className="w-[120px] h-[120px]"
                          />
                        ) : (
                          <div className="w-[120px] h-[120px] bg-gray-100 flex items-center justify-center">
                            <QrCodeIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* QR Code Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Scans:</span>
                        <span className="font-medium">{qrCode.viewCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Created:</span>
                        <span className="font-medium">
                          {new Date(qrCode.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {qrCode.expiryDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Expires:</span>
                          <span className="font-medium">
                            {new Date(qrCode.expiryDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* URL Display */}
                    <div className="p-2 bg-gray-50 rounded text-xs font-mono break-all">
                      {formUrl}
                    </div>
                  </div>
                </Card.Content>

                <Card.Footer>
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyUrl(qrCode.formId)}
                      >
                        <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                        Copy URL
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadQR(qrCode.formId)}
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <a
                      href={formUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </a>
                  </div>
                </Card.Footer>
              </Card>
            );
          })}
        </div>
      )}

      {/* QR Code Analytics */}
      {qrCodes.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title>QR Code Analytics</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {qrCodes.length}
                </div>
                <div className="text-sm text-gray-500">Total QR Codes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success-600">
                  {qrCodes.filter(qr => qr.isActive).length}
                </div>
                <div className="text-sm text-gray-500">Active QR Codes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning-600">
                  {qrCodes.reduce((sum, qr) => sum + (qr.scanCount || 0), 0)}
                </div>
                <div className="text-sm text-gray-500">Total Scans</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {qrCodes.length > 0 
                    ? Math.round(qrCodes.reduce((sum, qr) => sum + (qr.scanCount || 0), 0) / qrCodes.length)
                    : 0
                  }
                </div>
                <div className="text-sm text-gray-500">Avg. Scans per QR</div>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  );
};

export default QRCodes;
