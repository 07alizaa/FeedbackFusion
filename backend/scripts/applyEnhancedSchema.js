#!/usr/bin/env node
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runEnhancedSchema() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Running enhanced database schema...');
        
        // Read the schema file
        const schemaPath = path.join(__dirname, 'enhancedSchema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Execute the schema
        await client.query(schema);
        
        console.log('✅ Enhanced database schema applied successfully!');
        console.log('📊 New features added:');
        console.log('   - Subscription management with Stripe');
        console.log('   - AI insights and sentiment analysis');
        console.log('   - Advanced analytics tracking');
        console.log('   - Business profiles and reviews');
        console.log('   - Form templates and conditional logic');
        console.log('   - Rate limiting and security features');
        console.log('   - File upload management');
        console.log('   - Enhanced notifications system');
        
    } catch (error) {
        console.error('❌ Error applying enhanced schema:', error.message);
        console.error('Full error:', error);
    } finally {
        client.release();
        pool.end();
    }
}

// Run the schema
runEnhancedSchema();
