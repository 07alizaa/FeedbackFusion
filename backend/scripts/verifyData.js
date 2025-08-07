const { Pool } = require('pg');

const pool = new Pool({
  user: 'saishtiwari',
  host: 'localhost',
  database: 'feedbackfusion',
  password: 'pcps123',
  port: 5432,
});

async function verifyPopulatedData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 VERIFICATION OF POPULATED DATA\n');
    console.log('================================\n');

    // 1. Check users by subscription tier
    console.log('👥 USERS BY SUBSCRIPTION TIER:');
    const usersQuery = `
      SELECT 
        u.name, 
        u.email, 
        u.role,
        u.status,
        sp.name as plan_name,
        COALESCE(ut.responses_count, 0) as responses_this_month
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
      LEFT JOIN usage_tracking ut ON u.id = ut.user_id AND ut.month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
      WHERE u.role = 'vendor'
      ORDER BY sp.price DESC NULLS LAST, u.name
    `;
    
    const users = await client.query(usersQuery);
    
    const tiers = { 'Enterprise': [], 'Pro': [], 'Free': [] };
    users.rows.forEach(user => {
      const tier = user.plan_name || 'Free';
      tiers[tier].push(user);
    });
    
    Object.keys(tiers).forEach(tier => {
      console.log(`\n📊 ${tier} Tier (${tiers[tier].length} users):`);
      tiers[tier].forEach(user => {
        console.log(`  • ${user.name} (${user.email}) - Status: ${user.status} - Responses: ${user.responses_this_month}`);
      });
    });

    // 2. Check forms and responses
    console.log('\n\n📝 FORMS AND RESPONSES BY USER:');
    const formsQuery = `
      SELECT 
        u.name as user_name,
        u.email,
        sp.name as plan_name,
        sp.price as plan_price,
        f.title as form_title,
        f.status as form_status,
        f.is_active,
        COUNT(fe.id) as response_count,
        AVG(fe.ai_score) as avg_score
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
      LEFT JOIN feedback_forms f ON u.id = f.user_id
      LEFT JOIN feedback_entries fe ON f.id = fe.form_id
      WHERE u.role = 'vendor'
      GROUP BY u.id, u.name, u.email, sp.name, sp.price, f.id, f.title, f.status, f.is_active
      ORDER BY sp.price DESC NULLS LAST, u.name, f.title
    `;
    
    const forms = await client.query(formsQuery);
    
    let currentUser = '';
    forms.rows.forEach(form => {
      if (form.user_name !== currentUser) {
        currentUser = form.user_name;
        console.log(`\n👤 ${form.user_name} (${form.plan_name || 'Free'} - ${form.email}):`);
      }
      if (form.form_title) {
        console.log(`  📋 "${form.form_title}" - Status: ${form.form_status} - Active: ${form.is_active} - Responses: ${form.response_count} - Avg Score: ${form.avg_score ? Math.round(form.avg_score) : 'N/A'}`);
      }
    });

    // 3. Check AI insights
    console.log('\n\n🤖 AI INSIGHTS GENERATED:');
    const insightsQuery = `
      SELECT 
        u.name as user_name,
        f.title as form_title,
        ai.insight_type,
        ai.confidence_score,
        ai.generated_at::date as generated_date
      FROM ai_insights ai
      JOIN feedback_forms f ON ai.form_id = f.id
      JOIN users u ON ai.user_id = u.id
      ORDER BY u.name, f.title, ai.insight_type
    `;
    
    const insights = await client.query(insightsQuery);
    
    let currentFormOwner = '';
    insights.rows.forEach(insight => {
      const owner = `${insight.user_name} - ${insight.form_title}`;
      if (owner !== currentFormOwner) {
        currentFormOwner = owner;
        console.log(`\n🧠 ${insight.user_name} - "${insight.form_title}":`);
      }
      console.log(`  • ${insight.insight_type} (confidence: ${Math.round(insight.confidence_score * 100)}%) - ${insight.generated_date}`);
    });

    // 4. Check business profiles and reviews
    console.log('\n\n🏢 BUSINESS PROFILES AND REVIEWS:');
    const profilesQuery = `
      SELECT 
        bp.public_name,
        bp.slug,
        bp.is_public,
        u.name as owner_name,
        COUNT(br.id) as review_count,
        AVG(br.rating) as avg_rating
      FROM business_profiles bp
      JOIN users u ON bp.user_id = u.id
      LEFT JOIN business_reviews br ON bp.id = br.business_profile_id AND br.is_approved = true
      GROUP BY bp.id, bp.public_name, bp.slug, bp.is_public, u.name
      ORDER BY bp.public_name
    `;
    
    const profiles = await client.query(profilesQuery);
    
    profiles.rows.forEach(profile => {
      console.log(`🏬 ${profile.public_name} (@${profile.slug}) - Owner: ${profile.owner_name}`);
      console.log(`   Public: ${profile.is_public} | Reviews: ${profile.review_count} | Avg Rating: ${profile.avg_rating ? parseFloat(profile.avg_rating).toFixed(1) : 'N/A'} ⭐`);
    });

    // 5. Check notifications
    console.log('\n\n🔔 RECENT NOTIFICATIONS:');
    const notificationsQuery = `
      SELECT 
        u.name as user_name,
        n.type,
        n.title,
        n.is_read,
        n.created_at::date as created_date
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
      LIMIT 10
    `;
    
    const notifications = await client.query(notificationsQuery);
    
    notifications.rows.forEach(notif => {
      const status = notif.is_read ? '✅' : '📬';
      console.log(`${status} ${notif.user_name}: ${notif.title} (${notif.type}) - ${notif.created_date}`);
    });

    // 6. Sample response data
    console.log('\n\n💬 SAMPLE RESPONSE DATA:');
    const sampleResponsesQuery = `
      SELECT 
        u.name as user_name,
        f.title as form_title,
        fe.answers,
        fe.ai_score,
        fe.created_at::date as response_date
      FROM feedback_entries fe
      JOIN feedback_forms f ON fe.form_id = f.id
      JOIN users u ON f.user_id = u.id
      ORDER BY fe.created_at DESC
      LIMIT 5
    `;
    
    const sampleResponses = await client.query(sampleResponsesQuery);
    
    sampleResponses.rows.forEach((response, index) => {
      console.log(`\n📝 Response ${index + 1}: ${response.user_name} - "${response.form_title}" (Score: ${response.ai_score}) - ${response.response_date}`);
      
      try {
        const answers = JSON.parse(response.answers);
        Object.keys(answers).slice(0, 2).forEach(key => {
          let value = answers[key];
          if (Array.isArray(value)) {
            value = value.join(', ');
          }
          if (typeof value === 'string' && value.length > 50) {
            value = value.substring(0, 50) + '...';
          }
          console.log(`   ${key}: ${value}`);
        });
      } catch (error) {
        console.log('   [Response data parsing error]');
      }
    });

    console.log('\n\n✅ VERIFICATION COMPLETE!');
    console.log('\n🎯 KEY TESTING ACCOUNTS:');
    console.log('=========================');
    console.log('🆓 Free Tier: vendor.free@demo.com / demo123');
    console.log('💼 Pro Tier: vendor.pro@demo.com / demo123');  
    console.log('🏢 Enterprise Tier: vendor.enterprise@demo.com / demo123');
    console.log('👑 Admin: admin@feedbackfusion.com / admin123');
    
    console.log('\n📊 TOTAL POPULATED DATA:');
    console.log('=========================');
    console.log(`📝 Total Forms: ${forms.rows.filter(f => f.form_title).length}`);
    console.log(`💬 Total Responses: ${forms.rows.reduce((sum, f) => sum + (f.response_count || 0), 0)}`);
    console.log(`🤖 AI Insights: ${insights.rows.length}`);
    console.log(`🏢 Business Profiles: ${profiles.rows.length}`);
    console.log(`⭐ Business Reviews: ${profiles.rows.reduce((sum, p) => sum + (p.review_count || 0), 0)}`);
    console.log(`🔔 Notifications: ${notifications.rows.length}`);

  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    client.release();
  }
}

verifyPopulatedData()
  .then(() => {
    console.log('\n✅ Verification completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
