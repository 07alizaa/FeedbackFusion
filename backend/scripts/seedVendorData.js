const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: 'saishtiwari',
  host: 'localhost',
  database: 'feedbackfusion',
  password: 'pcps123',
  port: 5432,
});

async function seedVendorData() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting vendor data seeding...\n');

    // 1. Create vendor accounts with different subscription levels
    console.log('👤 Creating vendor accounts...');
    
    // Hash password for demo accounts
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    const vendors = [
      {
        email: 'vendor.free@demo.com',
        password: hashedPassword,
        full_name: 'Demo Free Vendor',
        role: 'vendor',
        business_category: 'Restaurant',
        business_description: 'Cozy Italian restaurant in downtown',
        business_address: '123 Main St, City, State 12345',
        business_phone: '+1-555-0123',
        plan: 'Free'
      },
      {
        email: 'vendor.pro@demo.com',
        password: hashedPassword,
        full_name: 'Demo Pro Vendor',
        role: 'vendor',
        business_category: 'Fitness Center',
        business_description: 'Modern gym with state-of-the-art equipment',
        business_address: '456 Fitness Ave, City, State 12345',
        business_phone: '+1-555-0456',
        plan: 'Pro'
      },
      {
        email: 'vendor.enterprise@demo.com',
        password: hashedPassword,
        full_name: 'Demo Enterprise Vendor',
        role: 'vendor',
        business_category: 'Retail Chain',
        business_description: 'Multi-location retail chain specializing in electronics',
        business_address: '789 Commerce Blvd, City, State 12345',
        business_phone: '+1-555-0789',
        plan: 'Enterprise'
      },
      {
        email: 'admin@demo.com',
        password: hashedPassword,
        full_name: 'Demo Admin',
        role: 'admin',
        business_category: 'Technology',
        business_description: 'FeedbackFusion Platform Administrator',
        business_address: '1 Tech Plaza, City, State 12345',
        business_phone: '+1-555-0001',
        plan: 'Enterprise'
      }
    ];

    const userIds = [];
    for (const vendor of vendors) {
      const userQuery = `
        INSERT INTO users (email, password_hash, name, role, business_name, phone, industry, company_size, marketing_opt_in, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          business_name = EXCLUDED.business_name,
          phone = EXCLUDED.phone,
          industry = EXCLUDED.industry
        RETURNING id
      `;
      
      const userResult = await client.query(userQuery, [
        vendor.email, vendor.password, vendor.full_name, vendor.role,
        vendor.business_description, vendor.business_phone, vendor.business_category,
        'Medium (50-200 employees)', true
      ]);
      
      userIds.push({
        id: userResult.rows[0].id,
        email: vendor.email,
        plan: vendor.plan
      });
    }

    console.log(`✅ Created ${userIds.length} vendor accounts`);

    // 2. Create subscriptions for each vendor
    console.log('💳 Setting up subscriptions...');
    
    for (const user of userIds) {
      const planQuery = 'SELECT id FROM subscription_plans WHERE name = $1';
      const planResult = await client.query(planQuery, [user.plan]);
      
      if (planResult.rows.length > 0) {
        const subscriptionQuery = `
          INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
          VALUES ($1, $2, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 month')
          ON CONFLICT DO NOTHING
        `;
        await client.query(subscriptionQuery, [user.id, planResult.rows[0].id]);
      }
    }

    console.log('✅ Subscriptions created');

    // 3. Create business profiles for public pages
    console.log('🏢 Creating business profiles...');
    
    const businessProfiles = [
      {
        userId: userIds[0].id, // Free vendor
        slug: 'marios-italian-bistro',
        publicName: "Mario's Italian Bistro",
        description: 'Authentic Italian cuisine with fresh ingredients and traditional recipes passed down through generations.',
        contactInfo: { phone: '+1-555-0123', email: 'contact@marios.com' },
        socialLinks: { facebook: 'marios.bistro', instagram: '@marios_bistro' },
        operatingHours: { 
          'Mon-Thu': '11:00 AM - 10:00 PM',
          'Fri-Sat': '11:00 AM - 11:00 PM',
          'Sun': '12:00 PM - 9:00 PM'
        },
        location: { address: '123 Main St, City, State 12345', coordinates: { lat: 40.7128, lng: -74.0060 } }
      },
      {
        userId: userIds[1].id, // Pro vendor
        slug: 'powerhouse-fitness',
        publicName: 'PowerHouse Fitness Center',
        description: 'State-of-the-art fitness facility with personal training, group classes, and 24/7 access.',
        contactInfo: { phone: '+1-555-0456', email: 'info@powerhousefitness.com' },
        socialLinks: { facebook: 'powerhouse.fitness', instagram: '@powerhouse_gym', twitter: '@PowerHouseFit' },
        operatingHours: { 
          'Mon-Sun': '24/7 Access',
          'Staffed Hours': 'Mon-Fri: 5:00 AM - 11:00 PM, Sat-Sun: 6:00 AM - 10:00 PM'
        },
        location: { address: '456 Fitness Ave, City, State 12345', coordinates: { lat: 40.7589, lng: -73.9851 } }
      },
      {
        userId: userIds[2].id, // Enterprise vendor
        slug: 'techzone-electronics',
        publicName: 'TechZone Electronics',
        description: 'Leading electronics retailer with multiple locations and online store. Expert advice and latest technology.',
        contactInfo: { phone: '+1-555-0789', email: 'support@techzone.com' },
        socialLinks: { 
          facebook: 'techzone.electronics', 
          instagram: '@techzone_official',
          twitter: '@TechZoneStore',
          linkedin: 'techzone-electronics'
        },
        operatingHours: { 
          'Mon-Sat': '9:00 AM - 9:00 PM',
          'Sun': '10:00 AM - 7:00 PM'
        },
        location: { address: '789 Commerce Blvd, City, State 12345', coordinates: { lat: 40.7505, lng: -73.9934 } }
      }
    ];

    for (const profile of businessProfiles) {
      const profileQuery = `
        INSERT INTO business_profiles (
          user_id, slug, public_name, description, contact_info, social_links, 
          operating_hours, location, is_public, seo_title, seo_description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10)
        ON CONFLICT (slug) DO UPDATE SET
          public_name = EXCLUDED.public_name,
          description = EXCLUDED.description,
          contact_info = EXCLUDED.contact_info,
          social_links = EXCLUDED.social_links,
          operating_hours = EXCLUDED.operating_hours,
          location = EXCLUDED.location
      `;
      
      await client.query(profileQuery, [
        profile.userId, profile.slug, profile.publicName, profile.description,
        JSON.stringify(profile.contactInfo), JSON.stringify(profile.socialLinks),
        JSON.stringify(profile.operatingHours), JSON.stringify(profile.location),
        `${profile.publicName} - Customer Reviews & Feedback`,
        `Read reviews and share your experience at ${profile.publicName}. ${profile.description}`
      ]);
    }

    console.log('✅ Business profiles created');

    // 4. Create feedback forms with different types
    console.log('📝 Creating feedback forms...');
    
    const forms = [
      {
        userId: userIds[0].id,
        title: 'Restaurant Dining Experience',
        description: 'Help us improve your dining experience',
        fields: [
          { type: 'rating', label: 'Overall Experience', required: true, max: 5 },
          { type: 'rating', label: 'Food Quality', required: true, max: 5 },
          { type: 'rating', label: 'Service Quality', required: true, max: 5 },
          { type: 'radio', label: 'How did you hear about us?', options: ['Social Media', 'Friends', 'Google', 'Walk-in'] },
          { type: 'checkbox', label: 'Which items did you order?', options: ['Appetizers', 'Main Course', 'Desserts', 'Beverages'] },
          { type: 'textarea', label: 'Additional Comments', placeholder: 'Tell us more about your experience...' }
        ],
        isActive: true,
        formType: 'feedback'
      },
      {
        userId: userIds[1].id,
        title: 'Gym Member Satisfaction Survey',
        description: 'Your feedback helps us maintain the best fitness environment',
        fields: [
          { type: 'rating', label: 'Equipment Quality', required: true, max: 5 },
          { type: 'rating', label: 'Cleanliness', required: true, max: 5 },
          { type: 'rating', label: 'Staff Helpfulness', required: true, max: 5 },
          { type: 'select', label: 'Membership Type', options: ['Basic', 'Premium', 'VIP'] },
          { type: 'checkbox', label: 'Which facilities do you use?', options: ['Cardio', 'Weights', 'Classes', 'Pool', 'Sauna'] },
          { type: 'textarea', label: 'Suggestions for Improvement' }
        ],
        isActive: true,
        formType: 'survey'
      },
      {
        userId: userIds[2].id,
        title: 'Product Purchase Feedback',
        description: 'Help us improve our products and services',
        fields: [
          { type: 'rating', label: 'Product Selection', required: true, max: 5 },
          { type: 'rating', label: 'Store Layout', required: true, max: 5 },
          { type: 'rating', label: 'Staff Assistance', required: true, max: 5 },
          { type: 'radio', label: 'Visit Frequency', options: ['First time', 'Monthly', 'Weekly', 'Daily'] },
          { type: 'number', label: 'How much did you spend today?', min: 0 },
          { type: 'textarea', label: 'What products would you like to see more of?' }
        ],
        isActive: true,
        formType: 'feedback'
      },
      {
        userId: userIds[1].id,
        title: 'Personal Training Evaluation',
        description: 'Rate your personal training experience',
        fields: [
          { type: 'rating', label: 'Trainer Knowledge', required: true, max: 5 },
          { type: 'rating', label: 'Session Planning', required: true, max: 5 },
          { type: 'rating', label: 'Motivation Level', required: true, max: 5 },
          { type: 'text', label: 'Trainer Name', required: true },
          { type: 'date', label: 'Session Date' },
          { type: 'textarea', label: 'Comments and Suggestions' }
        ],
        isActive: true,
        formType: 'evaluation'
      }
    ];

    const formIds = [];
    for (const form of forms) {
      const formQuery = `
        INSERT INTO feedback_forms (
          user_id, title, description, config, is_active, 
          created_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        RETURNING id
      `;
      
      const formResult = await client.query(formQuery, [
        form.userId, form.title, form.description, JSON.stringify({fields: form.fields, form_type: form.formType}),
        form.isActive
      ]);
      
      formIds.push({
        id: formResult.rows[0].id,
        userId: form.userId,
        title: form.title
      });
    }

    console.log(`✅ Created ${formIds.length} feedback forms`);

    // 5. Create sample feedback responses
    console.log('💬 Creating sample feedback responses...');
    
    const sampleResponses = [
      {
        formId: formIds[0].id, // Restaurant form
        responses: [
          {
            data: {
              'Overall Experience': 5,
              'Food Quality': 5,
              'Service Quality': 4,
              'How did you hear about us?': 'Friends',
              'Which items did you order?': ['Main Course', 'Desserts'],
              'Additional Comments': 'Excellent food and atmosphere! The pasta was amazing. Will definitely come back.'
            },
            sentiment: { score: 0.8, label: 'positive' }
          },
          {
            data: {
              'Overall Experience': 4,
              'Food Quality': 4,
              'Service Quality': 3,
              'How did you hear about us?': 'Google',
              'Which items did you order?': ['Appetizers', 'Main Course', 'Beverages'],
              'Additional Comments': 'Good food, but service was a bit slow during peak hours.'
            },
            sentiment: { score: 0.2, label: 'neutral' }
          },
          {
            data: {
              'Overall Experience': 3,
              'Food Quality': 2,
              'Service Quality': 2,
              'How did you hear about us?': 'Walk-in',
              'Which items did you order?': ['Main Course'],
              'Additional Comments': 'Food was cold when served and waited too long. Disappointed.'
            },
            sentiment: { score: -0.6, label: 'negative' }
          }
        ]
      },
      {
        formId: formIds[1].id, // Gym form
        responses: [
          {
            data: {
              'Equipment Quality': 5,
              'Cleanliness': 5,
              'Staff Helpfulness': 5,
              'Membership Type': 'Premium',
              'Which facilities do you use?': ['Cardio', 'Weights', 'Classes'],
              'Suggestions for Improvement': 'Maybe add more squat racks and extend evening class hours.'
            },
            sentiment: { score: 0.7, label: 'positive' }
          },
          {
            data: {
              'Equipment Quality': 4,
              'Cleanliness': 4,
              'Staff Helpfulness': 4,
              'Membership Type': 'Basic',
              'Which facilities do you use?': ['Cardio', 'Pool'],
              'Suggestions for Improvement': 'Pool temperature could be a bit warmer.'
            },
            sentiment: { score: 0.3, label: 'positive' }
          }
        ]
      }
    ];

    for (const formResponse of sampleResponses) {
      for (const response of formResponse.responses) {
        const responseQuery = `
          INSERT INTO feedback_entries (
            form_id, answers, ai_score, created_at
          ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP - INTERVAL '${Math.floor(Math.random() * 30)} days')
        `;
        
        await client.query(responseQuery, [
          formResponse.formId,
          JSON.stringify(response.data),
          Math.floor(response.sentiment.score * 100) // Convert to integer scale
        ]);
      }
    }

    console.log('✅ Sample responses created');

    // 6. Create business reviews
    console.log('⭐ Creating business reviews...');
    
    const reviews = [
      {
        businessSlug: 'marios-italian-bistro',
        reviews: [
          { name: 'Sarah Johnson', email: 'sarah@email.com', rating: 5, text: 'Amazing authentic Italian food! Best pasta in town.' },
          { name: 'Mike Chen', email: 'mike@email.com', rating: 4, text: 'Great atmosphere and friendly staff. Food was delicious.' },
          { name: 'Lisa Brown', email: 'lisa@email.com', rating: 5, text: 'Perfect date night restaurant. Highly recommend the tiramisu!' }
        ]
      },
      {
        businessSlug: 'powerhouse-fitness',
        reviews: [
          { name: 'John Smith', email: 'john@email.com', rating: 5, text: 'Best gym in the area! Clean, modern equipment and great staff.' },
          { name: 'Emma Wilson', email: 'emma@email.com', rating: 4, text: 'Love the group classes. Instructors are motivating and knowledgeable.' }
        ]
      }
    ];

    for (const businessReview of reviews) {
      const profileQuery = 'SELECT id FROM business_profiles WHERE slug = $1';
      const profileResult = await client.query(profileQuery, [businessReview.businessSlug]);
      
      if (profileResult.rows.length > 0) {
        const businessProfileId = profileResult.rows[0].id;
        
        for (const review of businessReview.reviews) {
          const reviewQuery = `
            INSERT INTO business_reviews (
              business_profile_id, reviewer_name, reviewer_email, rating, 
              review_text, is_verified, is_approved
            ) VALUES ($1, $2, $3, $4, $5, true, true)
          `;
          
          await client.query(reviewQuery, [
            businessProfileId, review.name, review.email, review.rating, review.text
          ]);
        }
      }
    }

    console.log('✅ Business reviews created');

    // 7. Create sample notifications
    console.log('🔔 Creating sample notifications...');
    
    for (const user of userIds) {
      const notifications = [
        {
          type: 'new_response',
          title: 'New Feedback Received',
          message: 'You have received new feedback on your form.',
          data: { formId: formIds[0]?.id }
        },
        {
          type: 'subscription_reminder',
          title: 'Subscription Renewal',
          message: 'Your subscription will renew in 7 days.',
          data: { daysLeft: 7 }
        },
        {
          type: 'form_analytics',
          title: 'Weekly Analytics Summary',
          message: 'Your forms received 15 new responses this week.',
          data: { responseCount: 15, period: 'week' }
        }
      ];
      
      for (const notification of notifications) {
        const notificationQuery = `
          INSERT INTO notifications (user_id, type, title, message, data)
          VALUES ($1, $2, $3, $4, $5)
        `;
        
        await client.query(notificationQuery, [
          user.id, notification.type, notification.title, 
          notification.message, JSON.stringify(notification.data)
        ]);
      }
    }

    console.log('✅ Sample notifications created');

    // 8. Create AI insights
    console.log('🤖 Creating AI insights...');
    
    for (const form of formIds) {
      const insights = [
        {
          type: 'sentiment_summary',
          data: {
            positive: 60,
            neutral: 25,
            negative: 15,
            averageScore: 0.45,
            totalResponses: 20,
            trend: 'improving'
          },
          confidence: 0.85
        },
        {
          type: 'recommendations',
          data: {
            suggestions: [
              'Focus on improving service speed during peak hours',
              'Highlight positive feedback about food quality in marketing',
              'Consider staff training for better customer interaction'
            ],
            priority: 'high'
          },
          confidence: 0.78
        }
      ];
      
      for (const insight of insights) {
        const insightQuery = `
          INSERT INTO ai_insights (form_id, user_id, insight_type, insight_data, confidence_score)
          VALUES ($1, $2, $3, $4, $5)
        `;
        
        await client.query(insightQuery, [
          form.id, form.userId, insight.type, 
          JSON.stringify(insight.data), insight.confidence
        ]);
      }
    }

    console.log('✅ AI insights created');

    // 9. Create usage tracking data
    console.log('📊 Creating usage tracking data...');
    
    for (const user of userIds) {
      const currentDate = new Date();
      for (let i = 0; i < 3; i++) {
        const monthYear = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
          .toISOString().substring(0, 7);
        
        const usageQuery = `
          INSERT INTO usage_tracking (user_id, forms_count, responses_count, month_year)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (user_id, month_year) DO NOTHING
        `;
        
        await client.query(usageQuery, [
          user.id,
          Math.floor(Math.random() * 5) + 1, // 1-5 forms
          Math.floor(Math.random() * 50) + 10, // 10-59 responses
          monthYear
        ]);
      }
    }

    console.log('✅ Usage tracking data created');

    console.log('\n🎉 Vendor data seeding completed successfully!\n');
    
    // Print access credentials
    console.log('🔐 DEMO ACCOUNT CREDENTIALS:');
    console.log('================================');
    console.log('🆓 FREE TIER ACCOUNT:');
    console.log('   Email: vendor.free@demo.com');
    console.log('   Password: demo123');
    console.log('   Business: Mario\'s Italian Bistro');
    console.log('   Features: Basic forms, limited responses');
    console.log('');
    console.log('⭐ PRO TIER ACCOUNT:');
    console.log('   Email: vendor.pro@demo.com');
    console.log('   Password: demo123');
    console.log('   Business: PowerHouse Fitness Center');
    console.log('   Features: AI analytics, advanced forms, QR codes');
    console.log('');
    console.log('🚀 ENTERPRISE TIER ACCOUNT:');
    console.log('   Email: vendor.enterprise@demo.com');
    console.log('   Password: demo123');
    console.log('   Business: TechZone Electronics');
    console.log('   Features: All features, unlimited usage, team access');
    console.log('');
    console.log('👨‍💼 ADMIN ACCOUNT:');
    console.log('   Email: admin@demo.com');
    console.log('   Password: demo123');
    console.log('   Role: Full admin access to all features');
    console.log('');
    console.log('🌐 PUBLIC BUSINESS PAGES:');
    console.log('   • http://localhost:5001/api/business/marios-italian-bistro');
    console.log('   • http://localhost:5001/api/business/powerhouse-fitness');
    console.log('   • http://localhost:5001/api/business/techzone-electronics');
    console.log('');
    console.log('📊 API ENDPOINTS TO TEST:');
    console.log('   • Admin Dashboard: http://localhost:5001/api/admin/stats');
    console.log('   • Forms Management: http://localhost:5001/api/forms');
    console.log('   • AI Insights: http://localhost:5001/api/ai/insights');
    console.log('   • Notifications: http://localhost:5001/api/notifications');
    console.log('   • Analytics: http://localhost:5001/api/admin/analytics');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the seeding
seedVendorData()
  .then(() => {
    console.log('\n✅ All done! You can now log in with the demo accounts.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
