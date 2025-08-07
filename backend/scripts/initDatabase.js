// scripts/initDatabase.js - Database initialization script
// Run this script to manually initialize the database
require('dotenv').config();
const { initializeDatabase } = require('../models/db');

async function runInitialization() {
  console.log('🔧 Starting database initialization...');
  
  try {
    await initializeDatabase();
    console.log('✅ Database initialization completed successfully!');
    console.log('📊 Tables created: users, feedback_forms, feedback_entries');
    console.log('📈 Indexes created for performance optimization');
    console.log('⏰ Triggers set up for automatic timestamp updates');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

runInitialization();
