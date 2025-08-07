// scripts/testBusinessRegistration.js - Test business registration to trigger real-time notifications
require('dotenv').config();
const { pool } = require('../models/db');
const bcrypt = require('bcrypt');

async function registerTestBusiness() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing business registration for real-time notifications...');
    
    const timestamp = Date.now();
    const testBusiness = {
      name: `Test Owner ${timestamp}`,
      email: `test${timestamp}@example.com`,
      businessName: `Test Business ${timestamp}`,
      phone: '+1-555-' + String(timestamp).slice(-4),
      industry: ['Technology', 'Food & Beverage', 'Health & Fitness', 'Retail'][Math.floor(Math.random() * 4)]
    };
    
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const result = await client.query(
      `INSERT INTO users (name, email, password_hash, role, business_name, phone, industry) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, name, email, business_name, industry, created_at`,
      [
        testBusiness.name, 
        testBusiness.email, 
        hashedPassword, 
        'vendor',
        testBusiness.businessName, 
        testBusiness.phone, 
        testBusiness.industry
      ]
    );
    
    const business = result.rows[0];
    
    console.log(`✅ Business registered successfully!`);
    console.log(`   Business ID: ${business.id}`);
    console.log(`   Business Name: ${business.business_name}`);
    console.log(`   Owner Name: ${business.name}`);
    console.log(`   Email: ${business.email}`);
    console.log(`   Industry: ${business.industry}`);
    console.log(`   Created: ${business.created_at}`);
    
    // Emit notification if global function exists
    if (typeof global.emitNotification === 'function') {
      global.emitNotification('business_registered', {
        id: business.id,
        businessName: business.business_name,
        ownerName: business.name,
        email: business.email,
        industry: business.industry,
        registeredAt: business.created_at
      });
      console.log('🔔 Real-time notification sent!');
    } else {
      console.log('ℹ️  Real-time notifications not available (server not running)');
    }
    
  } catch (error) {
    console.error('❌ Error registering test business:', error);
    throw error;
  } finally {
    client.release();
  }
}

registerTestBusiness()
  .then(() => {
    console.log('🎉 Test completed! Check your admin dashboard for new business registration.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
