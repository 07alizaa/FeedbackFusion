import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRightIcon,
  CheckIcon,
  StarIcon,
  PlayIcon,
  ChartBarIcon,
  DocumentTextIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const LandingPage = () => {
  const [_isVideoPlaying, setIsVideoPlaying] = useState(false);

  const features = [
    {
      icon: DocumentTextIcon,
      title: 'Smart Form Builder',
      description: 'Create beautiful, responsive feedback forms with our drag-and-drop builder. No coding required.',
    },
    {
      icon: QrCodeIcon,
      title: 'QR Code Integration',
      description: 'Generate QR codes for instant feedback collection. Perfect for restaurants, events, and retail.',
    },
    {
      icon: ChartBarIcon,
      title: 'Advanced Analytics',
      description: 'Get detailed insights with real-time analytics, charts, and automated reports.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Enterprise Security',
      description: 'Bank-level security with data encryption, GDPR compliance, and secure hosting.',
    },
    {
      icon: GlobeAltIcon,
      title: 'Multi-Channel Collection',
      description: 'Collect feedback via web, mobile, email, SMS, and social media platforms.',
    },
    {
      icon: UsersIcon,
      title: 'Team Collaboration',
      description: 'Work together with role-based access, team dashboards, and shared insights.',
    },
  ];

  const pricing = [
    {
      name: 'Starter',
      price: 29,
      description: 'Perfect for small businesses getting started',
      features: [
        'Up to 3 forms',
        '1,000 responses/month',
        'Basic analytics',
        'Email support',
        'QR code generation',
      ],
      popular: false,
    },
    {
      name: 'Professional',
      price: 79,
      description: 'Best for growing businesses',
      features: [
        'Unlimited forms',
        '10,000 responses/month',
        'Advanced analytics',
        'Priority support',
        'Custom branding',
        'API access',
        'Team collaboration',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 199,
      description: 'For large organizations',
      features: [
        'Everything in Professional',
        'Unlimited responses',
        'White-label solution',
        'Dedicated support',
        'Custom integrations',
        'Advanced security',
        'SLA guarantee',
      ],
      popular: false,
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Restaurant Manager',
      company: 'Bistro Delights',
      content: 'FeedbackFusion helped us improve our customer satisfaction by 40%. The QR code feature is a game-changer!',
      rating: 5,
    },
    {
      name: 'Mark Rodriguez',
      role: 'Marketing Director',
      company: 'TechStart Inc.',
      content: 'The analytics dashboard gives us insights we never had before. Our customer retention improved significantly.',
      rating: 5,
    },
    {
      name: 'Emily Johnson',
      role: 'Store Owner',
      company: 'Fashion Forward',
      content: 'Easy to use, beautiful forms, and excellent customer support. Exactly what we needed for our retail store.',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
                <span className="text-xl font-bold text-gray-900">FeedbackFusion</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900">Testimonials</a>
              <Link to="/login" className="text-gray-600 hover:text-gray-900">Sign In</Link>
              <Link to="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Transform Customer
              <span className="text-primary-600"> Feedback</span>
              <br />
              Into Business Growth
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Create beautiful feedback forms, collect responses with QR codes, and get actionable insights 
              to improve your business. Trusted by thousands of businesses worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="flex items-center">
                  Start Free Trial
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="flex items-center"
                onClick={() => setIsVideoPlaying(true)}
              >
                <PlayIcon className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
        
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-white -z-10"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to collect better feedback
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed to help you understand your customers better
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 h-full">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the perfect plan for your business needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricing.map((plan, index) => (
              <Card 
                key={index} 
                className={`p-8 relative ${plan.popular ? 'ring-2 ring-primary-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {plan.description}
                  </p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link to="/signup">
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? 'primary' : 'outline'}
                    >
                      Get Started
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by businesses worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers have to say about FeedbackFusion
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "{testimonial.content}"
                </p>
                <div>
                  <p className="font-semibold text-gray-900">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to transform your feedback process?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of businesses already using FeedbackFusion
          </p>
          <Link to="/signup">
            <Button size="lg" variant="outline" className="bg-white text-primary-600 hover:bg-gray-50">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
                <span className="text-xl font-bold">FeedbackFusion</span>
              </div>
              <p className="text-gray-400">
                Transform customer feedback into business growth with powerful analytics and insights.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">API</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 FeedbackFusion. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
