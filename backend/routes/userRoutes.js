const express = require('express');
const router = express.Router();
const { 
  getAllUsers, 
  getPendingUsers, 
  approveUser, 
  rejectUser, 
  getUserStats 
} = require('../controllers/userController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/users - Get all vendor users
router.get('/', getAllUsers);

// GET /api/users/pending - Get pending users
router.get('/pending', getPendingUsers);

// GET /api/users/stats - Get user statistics
router.get('/stats', getUserStats);

// PUT /api/users/:id/approve - Approve a user
router.put('/:id/approve', approveUser);

// PUT /api/users/:id/reject - Reject a user
router.put('/:id/reject', rejectUser);

module.exports = router;
