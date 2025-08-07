const pool = require('./db');

async function addStatusMessageColumn() {
  try {
    const client = await pool.connect();
    
    // Add status_message column to feedback_forms table
    await client.query(`
      ALTER TABLE feedback_forms 
      ADD COLUMN IF NOT EXISTS status_message TEXT
    `);
    
    console.log('✅ Added status_message column to feedback_forms table');
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding column:', error);
    process.exit(1);
  }
}

addStatusMessageColumn();
