// scripts/testFeedbackSubmission.js - Test feedback submission to trigger real-time notifications
require('dotenv').config();
const { pool } = require('../models/db');

async function submitTestFeedback() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing feedback submission for real-time notifications...');
    
    // Get an active form
    const formResult = await client.query(
      'SELECT id, title FROM feedback_forms WHERE is_active = true LIMIT 1'
    );
    
    if (formResult.rows.length === 0) {
      console.log('❌ No active forms found');
      return;
    }
    
    const form = formResult.rows[0];
    console.log(`📝 Found form: ${form.title} (ID: ${form.id})`);
    
    // Simulate feedback submission
    const testAnswers = {
      name: 'Test User ' + Date.now(),
      email: 'test@example.com',
      rating: Math.floor(Math.random() * 5) + 1,
      experience: ['Excellent', 'Good', 'Average', 'Poor'][Math.floor(Math.random() * 4)]
    };
    
    const aiScore = Math.floor(Math.random() * 100);
    
    const result = await client.query(
      `INSERT INTO feedback_entries (form_id, answers, wants_to_be_contacted, ai_score, is_flagged) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, created_at`,
      [
        form.id,
        JSON.stringify(testAnswers),
        false,
        aiScore,
        aiScore < 60
      ]
    );
    
    const entry = result.rows[0];
    
    console.log(`✅ Feedback submitted successfully!`);
    console.log(`   Entry ID: ${entry.id}`);
    console.log(`   AI Score: ${aiScore}`);
    console.log(`   Rating: ${testAnswers.rating}/5`);
    console.log(`   Created: ${entry.created_at}`);
    
    // Emit notification if global function exists
    if (typeof global.emitNotification === 'function') {
      global.emitNotification('response_submitted', {
        formId: form.id,
        formTitle: form.title,
        entryId: entry.id,
        score: aiScore,
        rating: testAnswers.rating,
        isFlagged: aiScore < 60,
        submittedAt: entry.created_at
      });
      console.log('🔔 Real-time notification sent!');
    } else {
      console.log('ℹ️  Real-time notifications not available (server not running)');
    }
    
  } catch (error) {
    console.error('❌ Error submitting test feedback:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run every 10 seconds for testing
async function runContinuousTest() {
  console.log('🚀 Starting continuous feedback submission test...');
  console.log('   This will submit a new feedback every 10 seconds');
  console.log('   Press Ctrl+C to stop');
  
  while (true) {
    try {
      await submitTestFeedback();
      console.log('⏰ Waiting 10 seconds for next submission...\n');
      await new Promise(resolve => setTimeout(resolve, 10000));
    } catch (error) {
      console.error('Error in continuous test:', error);
      break;
    }
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes('--continuous')) {
  runContinuousTest().catch(console.error);
} else {
  submitTestFeedback()
    .then(() => {
      console.log('🎉 Test completed! Check your admin dashboard for real-time updates.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}
