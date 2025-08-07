// controllers/qrController.js - QR Code management controller
const qrService = require('../utils/qrService');
const { pool } = require('../models/db');

/**
 * Generate QR code for a form
 */
const generateQRCode = async (req, res) => {
    try {
        const { formId } = req.params;
        const userId = req.user.userId;
        const options = req.body || {};

        // Verify form ownership
        const formResult = await pool.query(
            'SELECT * FROM feedback_forms WHERE id = $1 AND user_id = $2',
            [formId, userId]
        );

        if (formResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Form not found or access denied' 
            });
        }

        const qrCode = await qrService.generateFormQRCode(parseInt(formId), options);

        res.json({
            success: true,
            message: 'QR code generated successfully',
            qrCode: qrCode
        });

    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to generate QR code' 
        });
    }
};

/**
 * Get QR code for a form
 */
const getQRCode = async (req, res) => {
    try {
        const { formId } = req.params;
        const userId = req.user.userId;

        // Verify form ownership
        const formResult = await pool.query(
            'SELECT * FROM feedback_forms WHERE id = $1 AND user_id = $2',
            [formId, userId]
        );

        if (formResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Form not found or access denied' 
            });
        }

        const qrCode = await qrService.getFormQRCode(parseInt(formId));

        res.json({
            success: true,
            qrCode: qrCode
        });

    } catch (error) {
        console.error('Error getting QR code:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to get QR code' 
        });
    }
};

/**
 * Regenerate QR code for a form
 */
const regenerateQRCode = async (req, res) => {
    try {
        const { formId } = req.params;
        const userId = req.user.userId;
        const options = req.body || {};

        // Verify form ownership
        const formResult = await pool.query(
            'SELECT * FROM feedback_forms WHERE id = $1 AND user_id = $2',
            [formId, userId]
        );

        if (formResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Form not found or access denied' 
            });
        }

        const qrCode = await qrService.regenerateFormQRCode(parseInt(formId), options);

        res.json({
            success: true,
            message: 'QR code regenerated successfully',
            qrCode: qrCode
        });

    } catch (error) {
        console.error('Error regenerating QR code:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to regenerate QR code' 
        });
    }
};

/**
 * Toggle QR code active status
 */
const toggleQRCodeStatus = async (req, res) => {
    try {
        const { formId } = req.params;
        const { isActive } = req.body;
        const userId = req.user.userId;

        // Verify form ownership
        const formResult = await pool.query(
            'SELECT * FROM feedback_forms WHERE id = $1 AND user_id = $2',
            [formId, userId]
        );

        if (formResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Form not found or access denied' 
            });
        }

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ 
                success: false, 
                message: 'isActive must be a boolean value' 
            });
        }

        const result = await qrService.toggleQRCodeStatus(parseInt(formId), isActive);

        res.json({
            success: true,
            message: result.message,
            isActive: result.isActive
        });

    } catch (error) {
        console.error('Error toggling QR code status:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to toggle QR code status' 
        });
    }
};

/**
 * Set QR code expiry date
 */
const setQRCodeExpiry = async (req, res) => {
    try {
        const { formId } = req.params;
        const { expiryDate } = req.body;
        const userId = req.user.userId;

        // Verify form ownership
        const formResult = await pool.query(
            'SELECT * FROM feedback_forms WHERE id = $1 AND user_id = $2',
            [formId, userId]
        );

        if (formResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Form not found or access denied' 
            });
        }

        if (!expiryDate) {
            return res.status(400).json({ 
                success: false, 
                message: 'Expiry date is required' 
            });
        }

        const expiry = new Date(expiryDate);
        if (isNaN(expiry.getTime())) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid expiry date format' 
            });
        }

        if (expiry <= new Date()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Expiry date must be in the future' 
            });
        }

        const result = await qrService.setQRCodeExpiry(parseInt(formId), expiry);

        res.json({
            success: true,
            message: result.message,
            expiryDate: result.expiryDate
        });

    } catch (error) {
        console.error('Error setting QR code expiry:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to set QR code expiry' 
        });
    }
};

/**
 * Get QR code analytics
 */
const getQRCodeAnalytics = async (req, res) => {
    try {
        const { formId } = req.params;
        const userId = req.user.userId;

        // Verify form ownership
        const formResult = await pool.query(
            'SELECT * FROM feedback_forms WHERE id = $1 AND user_id = $2',
            [formId, userId]
        );

        if (formResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Form not found or access denied' 
            });
        }

        const analytics = await qrService.getQRCodeAnalytics(parseInt(formId));

        res.json({
            success: true,
            analytics: analytics
        });

    } catch (error) {
        console.error('Error getting QR code analytics:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to get QR code analytics' 
        });
    }
};

/**
 * Bulk generate QR codes for multiple forms
 */
const bulkGenerateQRCodes = async (req, res) => {
    try {
        const { formIds, options = {} } = req.body;
        const userId = req.user.userId;

        if (!formIds || !Array.isArray(formIds) || formIds.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Form IDs array is required' 
            });
        }

        // Verify all forms belong to the user
        const formResult = await pool.query(
            'SELECT id FROM feedback_forms WHERE id = ANY($1) AND user_id = $2',
            [formIds, userId]
        );

        const ownedFormIds = formResult.rows.map(row => row.id);
        const invalidFormIds = formIds.filter(id => !ownedFormIds.includes(parseInt(id)));

        if (invalidFormIds.length > 0) {
            return res.status(403).json({ 
                success: false, 
                message: `Access denied for form IDs: ${invalidFormIds.join(', ')}` 
            });
        }

        const results = await qrService.bulkGenerateQRCodes(ownedFormIds, options);

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        res.json({
            success: true,
            message: `Bulk QR code generation completed. ${successCount} successful, ${failureCount} failed.`,
            results: results,
            summary: {
                total: results.length,
                successful: successCount,
                failed: failureCount
            }
        });

    } catch (error) {
        console.error('Error bulk generating QR codes:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to bulk generate QR codes' 
        });
    }
};

/**
 * Get QR code customization options
 */
const getCustomizationOptions = async (req, res) => {
    try {
        const options = qrService.getQRCodeCustomizationOptions();

        res.json({
            success: true,
            customizationOptions: options
        });

    } catch (error) {
        console.error('Error getting customization options:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get customization options' 
        });
    }
};

/**
 * Download QR code as image
 */
const downloadQRCode = async (req, res) => {
    try {
        const { formId } = req.params;
        const { format = 'png', size = 256 } = req.query;
        const userId = req.user.userId;

        // Verify form ownership
        const formResult = await pool.query(
            'SELECT * FROM feedback_forms WHERE id = $1 AND user_id = $2',
            [formId, userId]
        );

        if (formResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Form not found or access denied' 
            });
        }

        const form = formResult.rows[0];

        // Generate QR code with specified options
        const qrCode = await qrService.generateFormQRCode(parseInt(formId), {
            width: parseInt(size),
            format: format
        });

        // Set appropriate headers
        const filename = `${form.title.replace(/[^a-zA-Z0-9]/g, '_')}_QR.${format}`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', `image/${format}`);

        // Send the QR code buffer
        res.send(qrCode.qrCodeBuffer);

    } catch (error) {
        console.error('Error downloading QR code:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to download QR code' 
        });
    }
};

/**
 * Get all QR codes for user's forms
 */
const getAllUserQRCodes = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(`
            SELECT 
                id, title, qr_code, qr_code_active, expiry_date,
                view_count, created_at
            FROM feedback_forms 
            WHERE user_id = $1 AND qr_code IS NOT NULL
            ORDER BY created_at DESC
        `, [userId]);

        const qrCodes = result.rows.map(form => ({
            formId: form.id,
            formTitle: form.title,
            qrCodeDataUrl: form.qr_code,
            isActive: form.qr_code_active,
            expiryDate: form.expiry_date,
            viewCount: form.view_count,
            createdAt: form.created_at
        }));

        res.json({
            success: true,
            qrCodes: qrCodes,
            total: qrCodes.length
        });

    } catch (error) {
        console.error('Error getting all QR codes:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get QR codes' 
        });
    }
};

module.exports = {
    generateQRCode,
    getQRCode,
    regenerateQRCode,
    toggleQRCodeStatus,
    setQRCodeExpiry,
    getQRCodeAnalytics,
    bulkGenerateQRCodes,
    getCustomizationOptions,
    downloadQRCode,
    getAllUserQRCodes
};
