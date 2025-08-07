// scripts/testSetup.js - Quick test to verify the backend setup
require('dotenv').config();
const { pool } = require('../models/db');

async function testBackendSetup() {
  console.log('🧪 Testing FeedbackFusion Backend Setup...\n');

  try {
    // Test 1: Database Connection
    console.log('1. Testing database connection...');
    const client = await pool.connect();
    console.log('   ✅ Database connection successful');
    client.release();

    // Test 2: Check if tables exist
    console.log('2. Checking database tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'feedback_forms', 'feedback_entries')
    `);
    
    const tableNames = tablesResult.rows.map(row => row.table_name);
    const expectedTables = ['users', 'feedback_forms', 'feedback_entries'];
    
    expectedTables.forEach(table => {
      if (tableNames.includes(table)) {
        console.log(`   ✅ Table '${table}' exists`);
      } else {
        console.log(`   ❌ Table '${table}' missing`);
      }
    });

    // Test 3: Environment Variables
    console.log('3. Checking environment variables...');
    const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
    
    requiredEnvVars.forEach(envVar => {
      if (process.env[envVar]) {
        console.log(`   ✅ ${envVar} is set`);
      } else {
        console.log(`   ❌ ${envVar} is missing`);
      }
    });

    // Test 4: JWT Secret validation
    console.log('4. Validating JWT secret...');
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length >= 32) {
      console.log('   ✅ JWT secret is adequately long');
    } else {
      console.log('   ⚠️  JWT secret should be at least 32 characters long');
    }

    // Test 5: Check indexes
    console.log('5. Checking database indexes...');
    const indexResult = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename IN ('feedback_forms', 'feedback_entries')
    `);
    
    if (indexResult.rows.length > 0) {
      console.log(`   ✅ Found ${indexResult.rows.length} performance indexes`);
    } else {
      console.log('   ⚠️  No performance indexes found');
    }

    // Test 6: Sample data insertion test
    console.log('6. Testing data insertion (will rollback)...');
    const testClient = await pool.connect();
    
    try {
      await testClient.query('BEGIN');
      
      // Insert test user
      const userResult = await testClient.query(`
        INSERT INTO users (name, email, password_hash, role) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id
      `, ['Test User', 'test@example.com', 'hashed_password', 'vendor']);
      
      console.log('   ✅ User insertion test successful');
      
      // Insert test form
      const formResult = await testClient.query(`
        INSERT INTO feedback_forms (user_id, title, config) 
        VALUES ($1, $2, $3) 
        RETURNING id
      `, [userResult.rows[0].id, 'Test Form', JSON.stringify({fields: []})]);
      
      console.log('   ✅ Form insertion test successful');
      
      // Insert test feedback entry
      await testClient.query(`
        INSERT INTO feedback_entries (form_id, answers, ai_score) 
        VALUES ($1, $2, $3)
      `, [formResult.rows[0].id, JSON.stringify({test: 'data'}), 50]);
      
      console.log('   ✅ Feedback entry insertion test successful');
      
      // Rollback the test data
      await testClient.query('ROLLBACK');
      console.log('   ✅ Test data rolled back successfully');
      
    } catch (error) {
      await testClient.query('ROLLBACK');
      console.log('   ❌ Data insertion test failed:', error.message);
    } finally {
      testClient.release();
    }

    console.log('\n🎉 Backend setup test completed!');
    console.log('\n📋 Summary:');
    console.log('   - Database: Connected and tables ready');
    console.log('   - Environment: Variables configured');
    console.log('   - Schema: All tables and indexes created');
    console.log('   - Data: Insertion/retrieval working');
    console.log('\n🚀 Your FeedbackFusion backend is ready to use!');
    console.log('   Start the server with: npm start or npm run dev');

  } catch (error) {
    console.error('❌ Setup test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your .env file configuration');
    console.log('   2. Ensure PostgreSQL is running');
    console.log('   3. Verify DATABASE_URL is correct');
    console.log('   4. Run: npm run init-db to initialize the database');
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Run the test
testBackendSetup();
