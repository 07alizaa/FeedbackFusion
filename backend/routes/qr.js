// routes/qr.js - QR Code management routes
const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All QR routes require authentication
router.use(authenticateToken);

// QR code management
router.post('/forms/:formId/generate', qrController.generateQRCode);
router.get('/forms/:formId', qrController.getQRCode);
router.put('/forms/:formId/regenerate', qrController.regenerateQRCode);
router.patch('/forms/:formId/toggle', qrController.toggleQRCodeStatus);
router.patch('/forms/:formId/expiry', qrController.setQRCodeExpiry);

// QR code analytics
router.get('/forms/:formId/analytics', qrController.getQRCodeAnalytics);

// Bulk operations
router.post('/bulk-generate', qrController.bulkGenerateQRCodes);

// Utility routes
router.get('/customization-options', qrController.getCustomizationOptions);
router.get('/forms/:formId/download', qrController.downloadQRCode);
router.get('/all', qrController.getAllUserQRCodes);

module.exports = router;
