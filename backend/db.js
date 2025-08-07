// db.js - Export database connection from models
const { pool, initializeDatabase } = require('./models/db');

module.exports = pool;

// Initialize database schema on startup
initializeDatabase().catch(console.error);