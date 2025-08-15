import { useState, useEffect } from 'react';
import { CheckIcon, CreditCardIcon, StarIcon } from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/Loading';
import { subscriptionAPI } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';

const Subscription = () => {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const [plansResponse, currentResponse, usageResponse] = await Promise.all([
        subscriptionAPI.getPlans(),
        subscriptionAPI.getCurrent().catch(() => ({ data: { data: null } })),
        subscriptionAPI.checkUsage().catch(() => ({ data: { data: null } })),
      ]);
      
      setPlans(plansResponse.data.data || []);
      setCurrentPlan(currentResponse.data.data);
      setUsage(usageResponse.data.data);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data if API doesn't return plans
  const mockPlans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 0,
      interval: 'month',
      features: [
        '3 Forms',
        '100 Responses/month',
        'Basic Analytics',
        'Email Support',
        'QR Code Generation',
      ],
      limits: {
        forms: 3,
        responses: 100,
      },
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 29,
      interval: 'month',
      popular: true,
      features: [
        '25 Forms',
        '2,500 Responses/month',
        'Advanced Analytics',
        'AI Insights',
        'Priority Support',
        'Custom Branding',
        'Export Data',
      ],
      limits: {
        forms: 25,
        responses: 2500,
      },
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      interval: 'month',
      features: [
        'Unlimited Forms',
        'Unlimited Responses',
        'Advanced AI Analytics',
        'White-label Solution',
        'Dedicated Support',
        'API Access',
        'Custom Integrations',
        'SSO Authentication',
      ],
      limits: {
        forms: -1, // unlimited
        responses: -1, // unlimited
      },
    },
  ];

  const displayPlans = plans.length > 0 ? plans : mockPlans;

  if (loading) {
    return <LoadingSpinner.Page />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
        <p className="mt-2 text-gray-600">
          Manage your subscription plan and billing
        </p>
      </div>

      {/* Current Plan */}
      {currentPlan && (
        <Card>
          <Card.Header>
            <Card.Title>Current Plan</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {currentPlan.planName || 'Starter'}
                </h3>
                <p className="text-sm text-gray-500">
                  {currentPlan.interval === 'year' ? 'Billed annually' : 'Billed monthly'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(currentPlan.amount || 0)}
                  <span className="text-sm font-normal text-gray-500">
                    /{currentPlan.interval || 'month'}
                  </span>
                </div>
                <Badge status="active">Active</Badge>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Usage Stats */}
      {usage && (
        <Card>
          <Card.Header>
            <Card.Title>Current Usage</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Forms</span>
                  <span className="text-sm text-gray-500">
                    {usage.formsUsed} / {usage.formsLimit === -1 ? '∞' : usage.formsLimit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{
                      width: usage.formsLimit === -1 ? '20%' : `${Math.min((usage.formsUsed / usage.formsLimit) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Responses</span>
                  <span className="text-sm text-gray-500">
                    {usage.responsesUsed} / {usage.responsesLimit === -1 ? '∞' : usage.responsesLimit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{
                      width: usage.responsesLimit === -1 ? '30%' : `${Math.min((usage.responsesUsed / usage.responsesLimit) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'ring-2 ring-primary-500' : ''}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-primary-500 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center">
                    <StarIcon className="h-3 w-3 mr-1" />
                    Most Popular
                  </span>
                </div>
              )}
              
              <Card.Header className="text-center">
                <Card.Title className="text-xl">{plan.name}</Card.Title>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="text-gray-500">/{plan.interval}</span>
                </div>
              </Card.Header>

              <Card.Content>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckIcon className="h-4 w-4 text-success-500 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card.Content>

              <Card.Footer>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'primary' : 'outline'}
                  disabled={currentPlan?.planId === plan.id}
                >
                  {currentPlan?.planId === plan.id ? 'Current Plan' : `Upgrade to ${plan.name}`}
                </Button>
              </Card.Footer>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing Section */}
      <Card>
        <Card.Header>
          <Card.Title>Billing & Payment</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <CreditCardIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Payment Method</p>
                  <p className="text-sm text-gray-500">
                    {currentPlan ? '**** **** **** 4242' : 'No payment method on file'}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                {currentPlan ? 'Update' : 'Add'}
              </Button>
            </div>

            {currentPlan && (
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Next billing date</p>
                  <p className="text-sm text-gray-500">
                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  View Invoices
                </Button>
              </div>
            )}

            <div className="flex space-x-3">
              <Button variant="outline">
                Billing Portal
              </Button>
              {currentPlan && (
                <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                  Cancel Subscription
                </Button>
              )}
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default Subscription;
