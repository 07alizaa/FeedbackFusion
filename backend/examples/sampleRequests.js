// examples/sampleRequests.js - Sample API requests for testing

// Example requests for FeedbackFusion API

const BASE_URL = 'http://localhost:5000/api';

// 1. User Registration (Vendor)
const registerVendor = {
  method: 'POST',
  url: `${BASE_URL}/auth/signup`,
  headers: { 'Content-Type': 'application/json' },
  body: {
    name: 'Acme Corp',
    email: 'vendor@acme.com',
    password: 'securepassword123',
    role: 'vendor'
  }
};

// 2. User Login
const login = {
  method: 'POST',
  url: `${BASE_URL}/auth/login`,
  headers: { 'Content-Type': 'application/json' },
  body: {
    email: 'vendor@acme.com',
    password: 'securepassword123'
  }
};

// 3. Create Feedback Form (requires vendor token)
const createForm = {
  method: 'POST',
  url: `${BASE_URL}/forms`,
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
  },
  body: {
    title: 'Customer Satisfaction Survey',
    config: {
      fields: [
        {
          type: 'text',
          name: 'customerName',
          label: 'Your Name (Optional)',
          required: false,
          placeholder: 'Enter your name'
        },
        {
          type: 'email',
          name: 'email',
          label: 'Email (Optional)',
          required: false,
          placeholder: 'your@email.com'
        },
        {
          type: 'radio',
          name: 'satisfaction',
          label: 'How satisfied are you with our service?',
          required: true,
          options: [
            { value: 'very-satisfied', label: 'Very Satisfied' },
            { value: 'satisfied', label: 'Satisfied' },
            { value: 'neutral', label: 'Neutral' },
            { value: 'dissatisfied', label: 'Dissatisfied' },
            { value: 'very-dissatisfied', label: 'Very Dissatisfied' }
          ]
        },
        {
          type: 'textarea',
          name: 'feedback',
          label: 'Please share your detailed feedback',
          required: true,
          placeholder: 'Tell us about your experience...',
          rows: 4
        },
        {
          type: 'checkbox',
          name: 'features',
          label: 'Which features did you use?',
          required: false,
          options: [
            { value: 'support', label: 'Customer Support' },
            { value: 'product', label: 'Product Features' },
            { value: 'billing', label: 'Billing & Payments' },
            { value: 'onboarding', label: 'Onboarding Process' }
          ]
        }
      ],
      settings: {
        allowAnonymous: true,
        requireContact: false,
        thankYouMessage: 'Thank you for your feedback!'
      }
    }
  }
};

// 4. Submit Feedback (public - no auth required)
const submitFeedback = {
  method: 'POST',
  url: `${BASE_URL}/forms/1/submit`, // Replace 1 with actual form ID
  headers: { 'Content-Type': 'application/json' },
  body: {
    answers: {
      customerName: 'John Doe',
      satisfaction: 'very-satisfied',
      feedback: 'Absolutely fantastic service! The team was responsive, helpful, and went above and beyond to solve my issues. The product works flawlessly and the user interface is intuitive. I would definitely recommend this to others.',
      features: ['support', 'product']
    },
    wantsToBeContacted: true,
    contactDetails: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0123',
      preferredContact: 'email'
    }
  }
};

// 5. Anonymous Feedback Submission
const submitAnonymousFeedback = {
  method: 'POST',
  url: `${BASE_URL}/forms/1/submit`,
  headers: { 'Content-Type': 'application/json' },
  body: {
    answers: {
      satisfaction: 'satisfied',
      feedback: 'Good service overall. The response time could be improved, but the quality of support is excellent.',
      features: ['support']
    },
    wantsToBeContacted: false
  }
};

// 6. Get Form Details (public)
const getForm = {
  method: 'GET',
  url: `${BASE_URL}/forms/1`, // Replace 1 with actual form ID
  headers: {}
};

// 7. Get Vendor Forms (requires vendor token)
const getVendorForms = {
  method: 'GET',
  url: `${BASE_URL}/forms/vendor/my`,
  headers: { 
    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
  }
};

// 8. Get Form Entries (requires vendor token)
const getFormEntries = {
  method: 'GET',
  url: `${BASE_URL}/forms/1/entries?page=1&limit=10&flagged=true`,
  headers: { 
    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
  }
};

// 9. Get Feedback Statistics (requires vendor token)
const getFeedbackStats = {
  method: 'GET',
  url: `${BASE_URL}/forms/1/stats`,
  headers: { 
    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
  }
};

// 10. Update Form (requires vendor token)
const updateForm = {
  method: 'PUT',
  url: `${BASE_URL}/forms/1`,
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
  },
  body: {
    title: 'Updated Customer Satisfaction Survey',
    isActive: true
  }
};

// Curl command examples for testing
const curlExamples = {
  healthCheck: 'curl http://localhost:5000/health',
  
  register: `curl -X POST http://localhost:5000/api/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Test Vendor","email":"test@example.com","password":"password123","role":"vendor"}'`,
  
  login: `curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"password123"}'`,
  
  createForm: `curl -X POST http://localhost:5000/api/forms \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{"title":"Test Form","config":{"fields":[{"type":"textarea","name":"feedback","label":"Feedback","required":true}]}}'`,
  
  submitFeedback: `curl -X POST http://localhost:5000/api/forms/1/submit \\
  -H "Content-Type: application/json" \\
  -d '{"answers":{"feedback":"Great service!"},"wantsToBeContacted":false}'`
};

module.exports = {
  registerVendor,
  login,
  createForm,
  submitFeedback,
  submitAnonymousFeedback,
  getForm,
  getVendorForms,
  getFormEntries,
  getFeedbackStats,
  updateForm,
  curlExamples
};

// Usage example:
// const { registerVendor } = require('./examples/sampleRequests');
// console.log(JSON.stringify(registerVendor, null, 2));
