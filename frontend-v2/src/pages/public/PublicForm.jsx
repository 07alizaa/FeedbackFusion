import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  PaperAirplaneIcon,
  StarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/Loading';
import { publicAPI, formsAPI } from '../../lib/api';

const PublicForm = () => {
  const { businessId, formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  useEffect(() => {
    fetchFormData();
  }, [businessId, formId]);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      
      // If we have both businessId and formId, use the old API structure
      if (businessId && formId) {
        const [formRes, businessRes] = await Promise.all([
          publicAPI.getForm(businessId, formId),
          publicAPI.getBusiness(businessId),
        ]);
        
        setForm(formRes.data.data);
        setBusiness(businessRes.data.data);
      } 
      // If we only have formId (from QR code), use the simpler API
      else if (formId) {
        const formRes = await formsAPI.getForm(formId);
        
        if (formRes.data.success) {
          setForm(formRes.data.data);
          // If form has business info, set it
          if (formRes.data.data.business) {
            setBusiness(formRes.data.data.business);
          }
        } else {
          throw new Error('Form not found');
        }
      } else {
        throw new Error('No form ID provided');
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
      setError('Form not found or no longer available');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError(null);
      
      // Use the appropriate submission method based on available parameters
      if (businessId && formId) {
        await publicAPI.submitForm(businessId, formId, data);
      } else if (formId) {
        await formsAPI.submitFeedback(formId, data);
      }
      
      setSubmitted(true);
      reset();
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const commonProps = {
      ...register(field.id, { 
        required: field.required ? `${field.label} is required` : false 
      }),
      className: errors[field.id] ? 'border-red-300' : '',
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <Input
            type={field.type}
            placeholder={field.placeholder}
            {...commonProps}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            rows={4}
            placeholder={field.placeholder}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors[field.id] ? 'border-red-300' : ''}`}
            {...commonProps}
          />
        );
      
      case 'select':
        return (
          <select
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors[field.id] ? 'border-red-300' : ''}`}
            {...commonProps}
          >
            <option value="">Select an option</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="radio"
                  value={option}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                  {...register(field.id, { 
                    required: field.required ? `${field.label} is required` : false 
                  })}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  value={option}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                  {...register(`${field.id}.${index}`)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'rating':
        return (
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <label key={rating} className="cursor-pointer">
                <input
                  type="radio"
                  value={rating}
                  className="sr-only"
                  {...register(field.id, { 
                    required: field.required ? `${field.label} is required` : false 
                  })}
                />
                <StarIcon className="h-8 w-8 text-gray-300 hover:text-yellow-400" />
              </label>
            ))}
          </div>
        );
      
      default:
        return (
          <Input
            type="text"
            placeholder={field.placeholder}
            {...commonProps}
          />
        );
    }
  };

  if (loading) {
    return <LoadingSpinner.Page />;
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 p-8 text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Form Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 p-8 text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-6">
            Your feedback has been submitted successfully. We appreciate your time and input.
          </p>
          <Button onClick={() => navigate(`/business/${businessId || 'unknown'}`)}>
            View Business Profile
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          {business?.logo && (
            <img 
              src={business.logo} 
              alt={business.name}
              className="h-16 w-16 mx-auto rounded-full mb-4"
            />
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {business?.name || 'Business'}
          </h1>
          <p className="text-gray-600">
            We value your feedback and would love to hear from you
          </p>
        </div>

        {/* Form */}
        <Card className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {form?.title || 'Feedback Form'}
            </h2>
            {form?.description && (
              <p className="text-gray-600">{form.description}</p>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {form?.fields?.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
                {errors[field.id] && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors[field.id].message}
                  </p>
                )}
              </div>
            ))}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={submitting}
                className="flex items-center"
              >
                {submitting ? (
                  <LoadingSpinner className="mr-2" />
                ) : (
                  <PaperAirplaneIcon className="mr-2 h-5 w-5" />
                )}
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Powered by{' '}
            <a 
              href="/" 
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              FeedbackFusion
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicForm;
