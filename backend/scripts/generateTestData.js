// scripts/generateTestData.js - Generate test data for dynamic dashboard
require('dotenv').config();
const { pool } = require('../models/db');
const bcrypt = require('bcrypt');

const sampleBusinesses = [
  {
    name: 'John Smith',
    email: 'john@coffeeshopxyz.com',
    businessName: 'Coffee Shop XYZ',
    phone: '+1-555-0123',
    industry: 'Food & Beverage'
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah@techsolutions.com',
    businessName: 'Tech Solutions Ltd',
    phone: '+1-555-0456',
    industry: 'Technology'
  },
  {
    name: 'Mike Wilson',
    email: 'mike@restaurantabc.com',
    businessName: 'Restaurant ABC',
    phone: '+1-555-0789',
    industry: 'Food & Beverage'
  },
  {
    name: 'Lisa Davis',
    email: 'lisa@fitnesscenterpro.com',
    businessName: 'Fitness Center Pro',
    phone: '+1-555-0321',
    industry: 'Health & Fitness'
  },
  {
    name: 'David Chen',
    email: 'david@bookstoreplus.com',
    businessName: 'Bookstore Plus',
    phone: '+1-555-0654',
    industry: 'Retail'
  }
];

const sampleForms = [
  {
    title: 'Customer Satisfaction Survey',
    config: {
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Your Name',
          required: true,
          placeholder: 'Enter your full name'
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          required: true,
          placeholder: 'your@email.com'
        },
        {
          id: 'rating',
          type: 'rating',
          label: 'Overall Rating',
          required: true
        },
        {
          id: 'experience',
          type: 'select',
          label: 'How was your experience?',
          required: true,
          options: ['Excellent', 'Good', 'Average', 'Poor']
        }
      ]
    }
  },
  {
    title: 'Product Feedback Form',
    config: {
      fields: [
        {
          id: 'product',
          type: 'select',
          label: 'Which product did you use?',
          required: true,
          options: ['Software A', 'Software B', 'Consulting Service']
        },
        {
          id: 'satisfaction',
          type: 'rating',
          label: 'Satisfaction Rating',
          required: true
        }
      ]
    }
  },
  {
    title: 'Service Quality Feedback',
    config: {
      fields: [
        {
          id: 'service_type',
          type: 'select',
          label: 'Service Type',
          required: true,
          options: ['Personal Training', 'Group Classes', 'Equipment']
        },
        {
          id: 'quality_rating',
          type: 'rating',
          label: 'Quality Rating',
          required: true
        },
        {
          id: 'comments',
          type: 'textarea',
          label: 'Additional Comments',
          required: false
        }
      ]
    }
  }
];

const sampleResponses = [
  {
    answers: {
      name: 'Alice Brown',
      email: 'alice@example.com',
      rating: 5,
      experience: 'Excellent'
    },
    wantsToBeContacted: true,
    contactDetails: {
      name: 'Alice Brown',
      email: 'alice@example.com'
    },
    aiScore: 90
  },
  {
    answers: {
      name: 'Bob Green',
      email: 'bob@example.com',
      rating: 4,
      experience: 'Good'
    },
    wantsToBeContacted: false,
    aiScore: 80
  },
  {
    answers: {
      product: 'Software A',
      satisfaction: 5
    },
    wantsToBeContacted: false,
    aiScore: 95
  },
  {
    answers: {
      service_type: 'Personal Training',
      quality_rating: 4,
      comments: 'Great trainer, very helpful!'
    },
    wantsToBeContacted: true,
    contactDetails: {
      name: 'Carol White',
      email: 'carol@example.com'
    },
    aiScore: 85
  }
];

async function generateTestData() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Generating test data...');
    
    // Create test businesses
    console.log('👥 Creating test businesses...');
    const businessIds = [];
    
    for (const business of sampleBusinesses) {
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      // Check if business already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [business.email]
      );
      
      if (existingUser.rows.length === 0) {
        const result = await client.query(
          `INSERT INTO users (name, email, password_hash, role, business_name, phone, industry) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           RETURNING id`,
          [business.name, business.email, hashedPassword, 'vendor', business.businessName, business.phone, business.industry]
        );
        businessIds.push(result.rows[0].id);
        console.log(`✅ Created business: ${business.businessName}`);
      } else {
        businessIds.push(existingUser.rows[0].id);
        console.log(`ℹ️  Business already exists: ${business.businessName}`);
      }
    }
    
    // Create test forms
    console.log('📝 Creating test forms...');
    const formIds = [];
    
    for (let i = 0; i < sampleForms.length; i++) {
      const form = sampleForms[i];
      const userId = businessIds[i % businessIds.length]; // Distribute forms among businesses
      
      const result = await client.query(
        `INSERT INTO feedback_forms (user_id, title, config, is_active) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id`,
        [userId, form.title, JSON.stringify(form.config), true]
      );
      formIds.push(result.rows[0].id);
      console.log(`✅ Created form: ${form.title}`);
    }
    
    // Create test responses
    console.log('💬 Creating test responses...');
    
    for (let i = 0; i < sampleResponses.length; i++) {
      const response = sampleResponses[i];
      const formId = formIds[i % formIds.length]; // Distribute responses among forms
      
      await client.query(
        `INSERT INTO feedback_entries (form_id, answers, wants_to_be_contacted, contact_details, ai_score, is_flagged) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          formId,
          JSON.stringify(response.answers),
          response.wantsToBeContacted || false,
          response.contactDetails ? JSON.stringify(response.contactDetails) : null,
          response.aiScore,
          response.aiScore < 60 // Flag responses with low scores
        ]
      );
      console.log(`✅ Created response for form ID: ${formId}`);
    }
    
    // Create some additional random responses for the last 24 hours
    console.log('🔄 Creating recent responses...');
    for (let i = 0; i < 10; i++) {
      const formId = formIds[Math.floor(Math.random() * formIds.length)];
      const score = Math.floor(Math.random() * 100);
      
      await client.query(
        `INSERT INTO feedback_entries (form_id, answers, ai_score, is_flagged, created_at) 
         VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${Math.floor(Math.random() * 24)} hours')`,
        [
          formId,
          JSON.stringify({ rating: Math.floor(Math.random() * 5) + 1 }),
          score,
          score < 60
        ]
      );
    }
    
    console.log('✅ Test data generation completed successfully!');
    console.log(`📊 Created: ${businessIds.length} businesses, ${formIds.length} forms, ${sampleResponses.length + 10} responses`);
    
  } catch (error) {
    console.error('❌ Error generating test data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the script
generateTestData()
  .then(() => {
    console.log('🎉 All done! You can now see dynamic data in the admin dashboard.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
