const { Pool } = require('pg');

const pool = new Pool({
  user: 'saishtiwari',
  host: 'localhost',
  database: 'feedbackfusion',
  password: 'pcps123',
  port: 5432,
});

async function approveAllAndPopulateResponses() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting approval and population process...\n');

    // 1. Approve all users
    console.log('👥 Approving all users...');
    
    const approveUsersQuery = `
      UPDATE users 
      SET status = 'approved', 
          verification_status = 'verified',
          updated_at = CURRENT_TIMESTAMP
      WHERE status != 'approved' OR verification_status != 'verified'
      RETURNING id, name, email, role
    `;
    
    const approvedUsers = await client.query(approveUsersQuery);
    console.log(`✅ Approved ${approvedUsers.rowCount} users`);
    
    // 2. Approve all forms
    console.log('📝 Approving all forms...');
    
    const approveFormsQuery = `
      UPDATE feedback_forms 
      SET status = 'approved',
          is_active = true,
          updated_at = CURRENT_TIMESTAMP
      WHERE status != 'approved' OR is_active != true
      RETURNING id, title, user_id
    `;
    
    const approvedForms = await client.query(approveFormsQuery);
    console.log(`✅ Approved ${approvedForms.rowCount} forms`);

    // 3. Get all users and their subscription tiers
    console.log('💳 Getting user subscription tiers...');
    
    const getUsersQuery = `
      SELECT u.id, u.name, u.email, u.role, sp.name as plan_name, sp.features
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE u.role = 'vendor'
      ORDER BY u.id
    `;
    
    const users = await client.query(getUsersQuery);
    console.log(`📊 Found ${users.rowCount} vendor users\n`);

    // 4. Get all forms for response population
    const getFormsQuery = `
      SELECT f.id, f.title, f.user_id, f.config, u.name as user_name
      FROM feedback_forms f
      JOIN users u ON f.user_id = u.id
      WHERE f.is_active = true AND f.status = 'approved'
      ORDER BY f.user_id, f.id
    `;
    
    const forms = await client.query(getFormsQuery);
    console.log(`📝 Found ${forms.rowCount} active forms to populate with responses\n`);

    // 5. Create comprehensive response data for each tier
    const responseTemplates = {
      'Free': [
        {
          sentiment: { score: 0.8, label: 'positive' },
          responseData: {
            'Overall Experience': 5,
            'Food Quality': 5,
            'Service Quality': 4,
            'How did you hear about us?': 'Social Media',
            'Which items did you order?': ['Main Course', 'Desserts'],
            'Additional Comments': 'Amazing experience! The food was delicious and the service was excellent. Will definitely come back with friends.'
          }
        },
        {
          sentiment: { score: 0.3, label: 'positive' },
          responseData: {
            'Overall Experience': 4,
            'Food Quality': 4,
            'Service Quality': 4,
            'How did you hear about us?': 'Friends',
            'Which items did you order?': ['Appetizers', 'Main Course'],
            'Additional Comments': 'Good food and nice atmosphere. Service was prompt and friendly.'
          }
        },
        {
          sentiment: { score: -0.2, label: 'neutral' },
          responseData: {
            'Overall Experience': 3,
            'Food Quality': 3,
            'Service Quality': 2,
            'How did you hear about us?': 'Google',
            'Which items did you order?': ['Main Course'],
            'Additional Comments': 'Food was okay but service was a bit slow. Could be better.'
          }
        }
      ],
      'Pro': [
        {
          sentiment: { score: 0.9, label: 'positive' },
          responseData: {
            'Equipment Quality': 5,
            'Cleanliness': 5,
            'Staff Helpfulness': 5,
            'Membership Type': 'Premium',
            'Which facilities do you use?': ['Cardio', 'Weights', 'Classes', 'Pool'],
            'Suggestions for Improvement': 'This gym is fantastic! The equipment is top-notch and the staff is incredibly helpful. Love the variety of classes offered.'
          }
        },
        {
          sentiment: { score: 0.7, label: 'positive' },
          responseData: {
            'Equipment Quality': 5,
            'Cleanliness': 4,
            'Staff Helpfulness': 4,
            'Membership Type': 'Basic',
            'Which facilities do you use?': ['Cardio', 'Weights'],
            'Suggestions for Improvement': 'Great gym with modern equipment. Could use more squat racks during peak hours.'
          }
        },
        {
          sentiment: { score: 0.5, label: 'positive' },
          responseData: {
            'Equipment Quality': 4,
            'Cleanliness': 4,
            'Staff Helpfulness': 3,
            'Membership Type': 'Premium',
            'Which facilities do you use?': ['Classes', 'Pool', 'Sauna'],
            'Suggestions for Improvement': 'Good facilities overall. Pool temperature could be warmer and more evening classes would be great.'
          }
        },
        {
          sentiment: { score: 0.2, label: 'neutral' },
          responseData: {
            'Equipment Quality': 3,
            'Cleanliness': 4,
            'Staff Helpfulness': 3,
            'Membership Type': 'Basic',
            'Which facilities do you use?': ['Cardio'],
            'Suggestions for Improvement': 'Decent gym but some equipment needs maintenance. Staff could be more attentive.'
          }
        },
        // Personal Training Evaluation responses
        {
          sentiment: { score: 0.8, label: 'positive' },
          responseData: {
            'Trainer Knowledge': 5,
            'Session Planning': 5,
            'Motivation Level': 5,
            'Trainer Name': 'Mike Johnson',
            'Session Date': '2025-08-01',
            'Comments and Suggestions': 'Mike is an excellent trainer! Very knowledgeable and motivating. Sessions are well planned and challenging.'
          }
        },
        {
          sentiment: { score: 0.6, label: 'positive' },
          responseData: {
            'Trainer Knowledge': 4,
            'Session Planning': 4,
            'Motivation Level': 4,
            'Trainer Name': 'Sarah Chen',
            'Session Date': '2025-08-02',
            'Comments and Suggestions': 'Good training sessions with Sarah. She knows her stuff and keeps me motivated.'
          }
        }
      ],
      'Enterprise': [
        {
          sentiment: { score: 0.8, label: 'positive' },
          responseData: {
            'Product Selection': 5,
            'Store Layout': 5,
            'Staff Assistance': 5,
            'Visit Frequency': 'Monthly',
            'How much did you spend today?': 450,
            'What products would you like to see more of?': 'Excellent selection of electronics! Staff was very knowledgeable and helped me find exactly what I needed. Would love to see more smart home devices.'
          }
        },
        {
          sentiment: { score: 0.6, label: 'positive' },
          responseData: {
            'Product Selection': 4,
            'Store Layout': 4,
            'Staff Assistance': 4,
            'Visit Frequency': 'Weekly',
            'How much did you spend today?': 120,
            'What products would you like to see more of?': 'Good store with helpful staff. Layout is easy to navigate. More gaming accessories would be great.'
          }
        },
        {
          sentiment: { score: 0.4, label: 'positive' },
          responseData: {
            'Product Selection': 4,
            'Store Layout': 3,
            'Staff Assistance': 3,
            'Visit Frequency': 'First time',
            'How much did you spend today?': 89,
            'What products would you like to see more of?': 'Decent selection but could be better organized. Staff was friendly but not very technical.'
          }
        },
        {
          sentiment: { score: 0.1, label: 'neutral' },
          responseData: {
            'Product Selection': 3,
            'Store Layout': 3,
            'Staff Assistance': 2,
            'Visit Frequency': 'Monthly',
            'How much did you spend today?': 0,
            'What products would you like to see more of?': 'Could not find what I was looking for. Staff seemed busy and could not help much. Store needs better organization.'
          }
        }
      ]
    };

    // 6. Populate responses for each form
    console.log('💬 Populating responses for all forms...\n');
    
    for (const form of forms.rows) {
      const user = users.rows.find(u => u.id === form.user_id);
      const planName = user?.plan_name || 'Free';
      const templates = responseTemplates[planName] || responseTemplates['Free'];
      
      console.log(`📝 Adding responses to "${form.title}" (${user?.name} - ${planName} tier)`);
      
      // Add 3-6 responses per form based on tier
      const responseCount = planName === 'Enterprise' ? 6 : planName === 'Pro' ? 5 : 3;
      
      for (let i = 0; i < responseCount; i++) {
        const template = templates[i % templates.length];
        
        // Create realistic response data based on form fields
        let adaptedResponse = {};
        
        try {
          const formFields = form.config?.fields || [];
          
          // Adapt response data to match form fields
          formFields.forEach(field => {
            if (template.responseData[field.label]) {
              adaptedResponse[field.label] = template.responseData[field.label];
            } else {
              // Generate appropriate response based on field type
              switch (field.type) {
                case 'rating':
                  adaptedResponse[field.label] = Math.floor(Math.random() * 2) + 4; // 4-5 rating
                  break;
                case 'text':
                  adaptedResponse[field.label] = `Sample ${field.label.toLowerCase()}`;
                  break;
                case 'textarea':
                  adaptedResponse[field.label] = `This is a sample response for ${field.label.toLowerCase()}. Great experience overall!`;
                  break;
                case 'radio':
                  if (field.options?.length > 0) {
                    adaptedResponse[field.label] = field.options[Math.floor(Math.random() * field.options.length)];
                  }
                  break;
                case 'select':
                  if (field.options?.length > 0) {
                    adaptedResponse[field.label] = field.options[Math.floor(Math.random() * field.options.length)];
                  }
                  break;
                case 'checkbox':
                  if (field.options?.length > 0) {
                    const selectedCount = Math.floor(Math.random() * field.options.length) + 1;
                    adaptedResponse[field.label] = field.options.slice(0, selectedCount);
                  }
                  break;
                case 'number':
                  adaptedResponse[field.label] = Math.floor(Math.random() * 100) + 50;
                  break;
                case 'date':
                  const today = new Date();
                  const randomDays = Math.floor(Math.random() * 30);
                  const randomDate = new Date(today.getTime() - randomDays * 24 * 60 * 60 * 1000);
                  adaptedResponse[field.label] = randomDate.toISOString().split('T')[0];
                  break;
              }
            }
          });
        } catch (error) {
          console.log(`Warning: Could not parse form config for form ${form.id}, using template data`);
          adaptedResponse = template.responseData;
        }

        const responseQuery = `
          INSERT INTO feedback_entries (
            form_id, answers, ai_score, created_at
          ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP - INTERVAL '${Math.floor(Math.random() * 30)} days')
        `;
        
        await client.query(responseQuery, [
          form.id,
          JSON.stringify(adaptedResponse),
          Math.floor(template.sentiment.score * 100)
        ]);
      }
      
      console.log(`  ✅ Added ${responseCount} responses`);
    }

    // 7. Update form statistics
    console.log('\n📊 Updating form statistics...');
    
    const updateStatsQuery = `
      UPDATE feedback_forms 
      SET 
        view_count = (SELECT COUNT(*) * 3 FROM feedback_entries WHERE form_id = feedback_forms.id),
        completion_rate = 85 + (RANDOM() * 15),
        avg_completion_time = 120 + (RANDOM() * 180)
      WHERE is_active = true
    `;
    
    await client.query(updateStatsQuery);
    console.log('✅ Updated form statistics');

    // 8. Create additional AI insights for populated data
    console.log('🤖 Generating AI insights for populated responses...');
    
    for (const form of forms.rows) {
      const user = users.rows.find(u => u.id === form.user_id);
      const planName = user?.plan_name || 'Free';
      
      // Only add AI insights for Pro and Enterprise users
      if (planName === 'Pro' || planName === 'Enterprise') {
        const insights = [
          {
            type: 'sentiment_summary',
            data: {
              positive: Math.floor(Math.random() * 20) + 60, // 60-80%
              neutral: Math.floor(Math.random() * 15) + 15,  // 15-30%
              negative: Math.floor(Math.random() * 10) + 5,  // 5-15%
              averageScore: 0.3 + (Math.random() * 0.5),     // 0.3-0.8
              totalResponses: Math.floor(Math.random() * 10) + 15,
              trend: Math.random() > 0.3 ? 'improving' : 'stable',
              weeklyChange: Math.random() * 20 - 10 // -10% to +10%
            },
            confidence: 0.75 + (Math.random() * 0.2)
          },
          {
            type: 'recommendations',
            data: {
              suggestions: [
                'Continue highlighting positive customer experiences in marketing materials',
                'Address service speed concerns during peak hours to improve satisfaction',
                'Consider implementing a loyalty program based on positive feedback patterns',
                'Train staff on upselling techniques for customers who rate experience highly'
              ],
              priority: 'high',
              expectedImpact: 'medium',
              implementationComplexity: 'low'
            },
            confidence: 0.68 + (Math.random() * 0.2)
          },
          {
            type: 'trends',
            data: {
              topKeywords: ['excellent', 'great', 'helpful', 'quality', 'service'],
              satisfactionTrend: 'increasing',
              peakResponseTimes: ['12:00-14:00', '18:00-20:00'],
              demographics: {
                'new_customers': 35,
                'returning_customers': 65
              },
              seasonality: 'high_weekend_activity'
            },
            confidence: 0.72 + (Math.random() * 0.15)
          }
        ];
        
        for (const insight of insights) {
          const insightQuery = `
            INSERT INTO ai_insights (form_id, user_id, insight_type, insight_data, confidence_score, generated_at)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP - INTERVAL '${Math.floor(Math.random() * 7)} days')
          `;
          
          await client.query(insightQuery, [
            form.id, form.user_id, insight.type, 
            JSON.stringify(insight.data), insight.confidence
          ]);
        }
      }
    }
    
    console.log('✅ Generated AI insights for Pro and Enterprise users');

    // 9. Update usage tracking
    console.log('📈 Updating usage tracking...');
    
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().substring(0, 7);
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString().substring(0, 7);
    
    for (const user of users.rows) {
      const formCount = forms.rows.filter(f => f.user_id === user.id).length;
      const responseCount = Math.floor(Math.random() * 50) + 20; // 20-70 responses
      
      // Current month
      const currentUsageQuery = `
        INSERT INTO usage_tracking (user_id, forms_count, responses_count, month_year)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, month_year) 
        DO UPDATE SET 
          forms_count = EXCLUDED.forms_count,
          responses_count = EXCLUDED.responses_count
      `;
      
      await client.query(currentUsageQuery, [user.id, formCount, responseCount, currentMonth]);
      
      // Last month
      await client.query(currentUsageQuery, [user.id, formCount, Math.floor(responseCount * 0.8), lastMonth]);
    }
    
    console.log('✅ Updated usage tracking for all users');

    // 10. Create more business reviews
    console.log('⭐ Adding more business reviews...');
    
    const businessProfilesQuery = `
      SELECT bp.id, bp.slug, bp.public_name, u.name as owner_name
      FROM business_profiles bp
      JOIN users u ON bp.user_id = u.id
    `;
    
    const businessProfiles = await client.query(businessProfilesQuery);
    
    const additionalReviews = [
      { name: 'Jennifer Wilson', email: 'jennifer@email.com', rating: 5, text: 'Outstanding service and quality! Highly recommend to everyone.' },
      { name: 'David Lee', email: 'david@email.com', rating: 4, text: 'Very good experience overall. Will definitely return.' },
      { name: 'Amanda Garcia', email: 'amanda@email.com', rating: 5, text: 'Exceeded my expectations! Professional and friendly staff.' },
      { name: 'Robert Taylor', email: 'robert@email.com', rating: 4, text: 'Great value for money and excellent customer service.' },
      { name: 'Maria Rodriguez', email: 'maria@email.com', rating: 5, text: 'Best experience I\'ve had! Everything was perfect.' },
      { name: 'James Brown', email: 'james@email.com', rating: 4, text: 'Good quality and reasonable prices. Satisfied customer.' }
    ];
    
    for (const profile of businessProfiles.rows) {
      const reviewsToAdd = Math.floor(Math.random() * 4) + 2; // 2-5 additional reviews
      
      for (let i = 0; i < reviewsToAdd; i++) {
        const review = additionalReviews[i % additionalReviews.length];
        
        const reviewQuery = `
          INSERT INTO business_reviews (
            business_profile_id, reviewer_name, reviewer_email, rating, 
            review_text, is_verified, is_approved, created_at
          ) VALUES ($1, $2, $3, $4, $5, true, true, CURRENT_TIMESTAMP - INTERVAL '${Math.floor(Math.random() * 60)} days')
        `;
        
        await client.query(reviewQuery, [
          profile.id, review.name, review.email, review.rating, review.text
        ]);
      }
      
      console.log(`  ✅ Added ${reviewsToAdd} reviews for ${profile.public_name}`);
    }

    // 11. Update notification preferences
    console.log('🔔 Setting up notification preferences...');
    
    const notificationPreferencesQuery = `
      INSERT INTO notification_preferences (user_id, email_enabled, in_app_enabled, feedback_notifications, review_notifications, admin_notifications)
      SELECT 
        id, 
        true, 
        true, 
        true, 
        CASE WHEN role = 'vendor' THEN true ELSE false END,
        CASE WHEN role = 'admin' THEN true ELSE false END
      FROM users
      ON CONFLICT (user_id) DO UPDATE SET
        email_enabled = EXCLUDED.email_enabled,
        in_app_enabled = EXCLUDED.in_app_enabled,
        feedback_notifications = EXCLUDED.feedback_notifications,
        review_notifications = EXCLUDED.review_notifications,
        admin_notifications = EXCLUDED.admin_notifications
    `;
    
    // Check if notification_preferences table exists
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notification_preferences'
      )
    `;
    
    const tableExists = await client.query(tableExistsQuery);
    
    if (tableExists.rows[0].exists) {
      await client.query(notificationPreferencesQuery);
      console.log('✅ Updated notification preferences');
    } else {
      console.log('⚠️  Notification preferences table not found, skipping...');
    }

    console.log('\n🎉 APPROVAL AND POPULATION COMPLETED SUCCESSFULLY!\n');
    
    // Final summary
    console.log('📊 FINAL SUMMARY:');
    console.log('================================');
    
    const finalStatsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'vendor' AND status = 'approved') as approved_vendors,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_users,
        (SELECT COUNT(*) FROM feedback_forms WHERE status = 'approved' AND is_active = true) as active_forms,
        (SELECT COUNT(*) FROM feedback_entries) as total_responses,
        (SELECT COUNT(*) FROM business_profiles WHERE is_public = true) as public_profiles,
        (SELECT COUNT(*) FROM business_reviews WHERE is_approved = true) as approved_reviews,
        (SELECT COUNT(*) FROM ai_insights) as ai_insights_generated,
        (SELECT COUNT(*) FROM notifications) as total_notifications
    `;
    
    const finalStats = await client.query(finalStatsQuery);
    const stats = finalStats.rows[0];
    
    console.log(`✅ Approved Vendors: ${stats.approved_vendors}`);
    console.log(`✅ Admin Users: ${stats.admin_users}`);
    console.log(`✅ Active Forms: ${stats.active_forms}`);
    console.log(`✅ Total Responses: ${stats.total_responses}`);
    console.log(`✅ Public Business Profiles: ${stats.public_profiles}`);
    console.log(`✅ Approved Reviews: ${stats.approved_reviews}`);
    console.log(`✅ AI Insights Generated: ${stats.ai_insights_generated}`);
    console.log(`✅ Notifications Created: ${stats.total_notifications}`);
    
    console.log('\n🚀 ALL USERS AND FORMS ARE NOW APPROVED!');
    console.log('📊 ALL TIERS HAVE COMPREHENSIVE RESPONSE DATA!');
    console.log('🤖 AI INSIGHTS GENERATED FOR PRO/ENTERPRISE USERS!');
    console.log('⭐ BUSINESS PROFILES HAVE MULTIPLE REVIEWS!');
    console.log('\n🎯 Your FeedbackFusion platform is now fully populated and ready for testing!');

  } catch (error) {
    console.error('❌ Error during approval and population:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the approval and population
approveAllAndPopulateResponses()
  .then(() => {
    console.log('\n✅ Process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Process failed:', error);
    process.exit(1);
  });
