// models/db.js - Database connection and schema setup
const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Database schema setup function
async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('vendor', 'admin')),
        business_name VARCHAR(255),
        phone VARCHAR(50),
        industry VARCHAR(100),
        company_size VARCHAR(50),
        marketing_opt_in BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create feedback_forms table
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedback_forms (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        config JSONB NOT NULL DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create feedback_entries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedback_entries (
        id SERIAL PRIMARY KEY,
        form_id INTEGER NOT NULL REFERENCES feedback_forms(id) ON DELETE CASCADE,
        answers JSONB NOT NULL DEFAULT '{}',
        wants_to_be_contacted BOOLEAN DEFAULT false,
        contact_details JSONB DEFAULT NULL,
        ai_score INTEGER DEFAULT 0,
        is_flagged BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_feedback_forms_user_id ON feedback_forms(user_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_feedback_entries_form_id ON feedback_entries(form_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_feedback_entries_ai_score ON feedback_entries(ai_score DESC);
    `);

    // Add status and description columns to existing feedback_forms table if they don't exist
    try {
      await client.query(`
        ALTER TABLE feedback_forms 
        ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS description TEXT;
      `);
    } catch (error) {
      // Ignore errors if columns already exist
      console.log('Status/description columns may already exist:', error.message);
    }

    // Create trigger to update updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Apply triggers to tables
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_forms_updated_at ON feedback_forms;
      CREATE TRIGGER update_forms_updated_at 
        BEFORE UPDATE ON feedback_forms 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_entries_updated_at ON feedback_entries;
      CREATE TRIGGER update_entries_updated_at 
        BEFORE UPDATE ON feedback_entries 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Error handling for pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  pool,
  initializeDatabase
};
