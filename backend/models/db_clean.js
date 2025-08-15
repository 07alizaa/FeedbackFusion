// models/db.js - Database connection and schema setup
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  acquireTimeoutMillis: 10000,
  statementTimeout: 0,
});

// Global flag to ensure initialization only runs once per process
let isInitialized = false;
let initializationInProgress = false;

// Database schema setup function
async function initializeDatabase() {
  if (isInitialized) {
    return;
  }
  
  if (initializationInProgress) {
    while (initializationInProgress) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }
  
  initializationInProgress = true;
  
  let client;
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      client = await pool.connect();
      break;
    } catch (error) {
      retryCount++;
      console.error(`Database connection attempt ${retryCount} failed:`, error.message);
      
      if (retryCount >= maxRetries) {
        console.error(`Failed to connect to database after ${maxRetries} attempts:`, error.message);
        initializationInProgress = false;
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  try {
    // Create users table
    try {
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
          status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (error) {
      console.error('Error creating users table:', error.message);
    }

    // Create feedback_forms table
    try {
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
    } catch (error) {
      console.error('Error creating feedback_forms table:', error.message);
    }

    // Create feedback_entries table
    try {
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
    } catch (error) {
      console.error('Error creating feedback_entries table:', error.message);
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_feedback_forms_user_id ON feedback_forms(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_feedback_entries_form_id ON feedback_entries(form_id)',
      'CREATE INDEX IF NOT EXISTS idx_feedback_entries_ai_score ON feedback_entries(ai_score DESC)'
    ];

    for (const indexQuery of indexes) {
      try {
        await client.query(indexQuery);
      } catch (error) {
        console.error('Error creating index:', error.message);
      }
    }

    // Add columns if they don't exist
    try {
      await client.query('ALTER TABLE feedback_forms ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT \'pending\'');
      await client.query('ALTER TABLE feedback_forms ADD COLUMN IF NOT EXISTS description TEXT');
      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT \'pending\' CHECK (status IN (\'pending\', \'approved\', \'rejected\', \'suspended\'))');
    } catch (error) {
      console.error('Error adding columns:', error.message);
    }
      
    // Ensure admin users are always approved
    try {
      await client.query('UPDATE users SET status = \'approved\' WHERE role = \'admin\' AND (status IS NULL OR status = \'pending\')');
    } catch (error) {
      console.error('Error updating admin users status:', error.message);
    }

    // Create trigger function
    try {
      await client.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);
    } catch (error) {
      console.error('Error creating update function:', error.message);
    }

    // Apply triggers to tables
    const triggers = [
      { table: 'users', name: 'update_users_updated_at' },
      { table: 'feedback_forms', name: 'update_forms_updated_at' },
      { table: 'feedback_entries', name: 'update_entries_updated_at' }
    ];

    for (const trigger of triggers) {
      try {
        await client.query(`DROP TRIGGER IF EXISTS ${trigger.name} ON ${trigger.table}`);
        await client.query(`CREATE TRIGGER ${trigger.name} BEFORE UPDATE ON ${trigger.table} FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);
      } catch (error) {
        console.error(`Error creating trigger for ${trigger.table}:`, error.message);
      }
    }

    // Insert default admin user if it doesn't exist
    try {
      const hashedPassword = await bcrypt.hash('Admin@1234', 12);
      
      await client.query(`
        INSERT INTO users (name, email, password_hash, role, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (email) 
        DO UPDATE SET 
          status = 'approved',
          updated_at = CURRENT_TIMESTAMP
        WHERE users.email = $2
      `, ['System Admin', 'admin@gmail.com', hashedPassword, 'admin', 'approved']);
    } catch (error) {
      console.error('Error creating default admin user:', error.message);
    }

    console.log('✅ Database initialized successfully');
    isInitialized = true;
  } catch (error) {
    console.error('Database initialization failed:', error.message);
  } finally {
    initializationInProgress = false;
    if (client) {
      client.release();
    }
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
