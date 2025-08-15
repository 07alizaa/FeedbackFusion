// utils/qrService.js - QR Code generation and management
const QRCode = require('qrcode');
const { pool } = require('../models/db');
const crypto = require('crypto');

/**
 * Generate a unique QR code for a form
 * @param {number} formId - Form ID
 * @param {Object} options - QR code options
 * @returns {Object} - QR code data and URL
 */
async function generateFormQRCode(formId, options = {}) {
    try {
        console.log('🔍 QR Service - generateFormQRCode called');
        console.log('📝 Form ID:', formId, typeof formId);
        console.log('⚙️ Options:', JSON.stringify(options, null, 2));

        // Get form details
        console.log('🔍 Getting form details from database...');
        const formResult = await pool.query(`
            SELECT ff.*, u.business_name 
            FROM feedback_forms ff 
            JOIN users u ON ff.user_id = u.id 
            WHERE ff.id = $1
        `, [formId]);

        console.log('📊 Form query result:', formResult.rows.length, 'rows found');
        if (formResult.rows.length === 0) {
            console.log('❌ Form not found in database');
            throw new Error('Form not found');
        }

        const form = formResult.rows[0];
        console.log('📋 Form details:', JSON.stringify({
            id: form.id,
            title: form.title,
            user_id: form.user_id,
            business_name: form.business_name,
            is_approved: form.is_approved,
            is_active: form.is_active
        }, null, 2));
        
        // Generate unique code for the form
        console.log('🔍 Generating unique code...');
        const uniqueCode = crypto.randomBytes(8).toString('hex');
        console.log('🆔 Generated unique code:', uniqueCode);
        
        // Create the public form URL
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
        const formUrl = `${baseUrl}/form/${formId}?code=${uniqueCode}`;
        console.log('🔗 Form URL:', formUrl);
        console.log('🌍 Base URL from env:', baseUrl);
        
        // QR code options
        const qrOptions = {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            quality: 0.92,
            margin: 1,
            color: {
                dark: options.darkColor || '#000000',
                light: options.lightColor || '#FFFFFF'
            },
            width: options.width || 256,
            ...options
        };
        console.log('🎨 QR Options:', JSON.stringify(qrOptions, null, 2));

        // Generate QR code as data URL
        console.log('🔍 Generating QR code data URL...');
        const qrCodeDataUrl = await QRCode.toDataURL(formUrl, qrOptions);
        console.log('✅ QR code data URL generated, length:', qrCodeDataUrl.length);
        
        // Generate QR code as buffer for file storage
        console.log('🔍 Generating QR code buffer...');
        const qrCodeBuffer = await QRCode.toBuffer(formUrl, qrOptions);
        console.log('✅ QR code buffer generated, size:', qrCodeBuffer.length, 'bytes');
        
        // Update form with QR code data
        console.log('🔍 Updating form with QR code data...');
        const updateResult = await pool.query(`
            UPDATE feedback_forms 
            SET qr_code = $1, qr_code_active = true, updated_at = NOW()
            WHERE id = $2
        `, [qrCodeDataUrl, formId]);
        console.log('📊 Update result rows affected:', updateResult.rowCount);

        // Log QR code generation
        console.log('🔍 Logging QR code generation event...');
        await pool.query(`
            INSERT INTO analytics_events (form_id, event_type, event_data, timestamp)
            VALUES ($1, 'qr_code_generated', $2, NOW())
        `, [formId, JSON.stringify({ 
            uniqueCode, 
            generatedAt: new Date().toISOString(),
            options: qrOptions 
        })]);
        console.log('✅ QR code generation event logged');

        const response = {
            qrCodeDataUrl,
            qrCodeBuffer,
            formUrl,
            uniqueCode,
            formTitle: form.title,
            businessName: form.business_name,
            isActive: true
        };

        console.log('✅ QR Service - Returning response:', JSON.stringify({
            ...response,
            qrCodeBuffer: `[Buffer ${response.qrCodeBuffer.length} bytes]`,
            qrCodeDataUrl: `[DataURL ${response.qrCodeDataUrl.length} chars]`
        }, null, 2));

        return response;

    } catch (error) {
        console.error('❌ QR Service Error:', error);
        console.error('❌ QR Service Error Stack:', error.stack);
        throw new Error('Failed to generate QR code: ' + error.message);
    }
}

/**
 * Get QR code for a form
 * @param {number} formId - Form ID
 * @returns {Object} - QR code data
 */
async function getFormQRCode(formId) {
    try {
        const result = await pool.query(`
            SELECT qr_code, qr_code_active, title 
            FROM feedback_forms 
            WHERE id = $1
        `, [formId]);

        if (result.rows.length === 0) {
            throw new Error('Form not found');
        }

        const form = result.rows[0];
        
        if (!form.qr_code) {
            // Generate QR code if it doesn't exist
            return await generateFormQRCode(formId);
        }

        return {
            qrCodeDataUrl: form.qr_code,
            isActive: form.qr_code_active,
            formTitle: form.title
        };

    } catch (error) {
        console.error('Error getting QR code:', error);
        throw error;
    }
}

/**
 * Regenerate QR code for a form
 * @param {number} formId - Form ID
 * @param {Object} options - New QR code options
 * @returns {Object} - New QR code data
 */
async function regenerateFormQRCode(formId, options = {}) {
    try {
        // Deactivate old QR code
        await pool.query(`
            UPDATE feedback_forms 
            SET qr_code_active = false 
            WHERE id = $1
        `, [formId]);

        // Generate new QR code
        const newQRCode = await generateFormQRCode(formId, options);

        // Log regeneration
        await pool.query(`
            INSERT INTO analytics_events (form_id, event_type, event_data, timestamp)
            VALUES ($1, 'qr_code_regenerated', $2, NOW())
        `, [formId, JSON.stringify({ 
            regeneratedAt: new Date().toISOString(),
            reason: options.reason || 'manual_regeneration'
        })]);

        return newQRCode;

    } catch (error) {
        console.error('Error regenerating QR code:', error);
        throw error;
    }
}

/**
 * Toggle QR code active status
 * @param {number} formId - Form ID
 * @param {boolean} isActive - Active status
 * @returns {Object} - Updated status
 */
async function toggleQRCodeStatus(formId, isActive) {
    try {
        await pool.query(`
            UPDATE feedback_forms 
            SET qr_code_active = $1, updated_at = NOW()
            WHERE id = $2
        `, [isActive, formId]);

        // Log status change
        await pool.query(`
            INSERT INTO analytics_events (form_id, event_type, event_data, timestamp)
            VALUES ($1, 'qr_code_status_changed', $2, NOW())
        `, [formId, JSON.stringify({ 
            newStatus: isActive ? 'active' : 'inactive',
            changedAt: new Date().toISOString()
        })]);

        return { 
            success: true, 
            isActive, 
            message: `QR code ${isActive ? 'activated' : 'deactivated'}` 
        };

    } catch (error) {
        console.error('Error toggling QR code status:', error);
        throw error;
    }
}

/**
 * Set QR code expiry
 * @param {number} formId - Form ID
 * @param {Date} expiryDate - Expiry date
 * @returns {Object} - Updated expiry info
 */
async function setQRCodeExpiry(formId, expiryDate) {
    try {
        await pool.query(`
            UPDATE feedback_forms 
            SET expiry_date = $1, updated_at = NOW()
            WHERE id = $2
        `, [expiryDate, formId]);

        // Schedule automatic deactivation (this would typically be handled by a cron job)
        const now = new Date();
        if (expiryDate <= now) {
            await toggleQRCodeStatus(formId, false);
        }

        // Log expiry setting
        await pool.query(`
            INSERT INTO analytics_events (form_id, event_type, event_data, timestamp)
            VALUES ($1, 'qr_code_expiry_set', $2, NOW())
        `, [formId, JSON.stringify({ 
            expiryDate: expiryDate.toISOString(),
            setAt: new Date().toISOString()
        })]);

        return { 
            success: true, 
            expiryDate,
            message: 'QR code expiry set successfully' 
        };

    } catch (error) {
        console.error('Error setting QR code expiry:', error);
        throw error;
    }
}

/**
 * Get QR code analytics
 * @param {number} formId - Form ID
 * @returns {Object} - QR code analytics data
 */
async function getQRCodeAnalytics(formId) {
    try {
        // Get QR code scans (form views with QR code source)
        const scansResult = await pool.query(`
            SELECT DATE(timestamp) as date, COUNT(*) as scans
            FROM analytics_events 
            WHERE form_id = $1 
            AND event_type = 'form_view'
            AND event_data->>'source' = 'qr_code'
            AND timestamp >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(timestamp)
            ORDER BY date DESC
        `, [formId]);

        // Get total scans
        const totalScansResult = await pool.query(`
            SELECT COUNT(*) as total_scans
            FROM analytics_events 
            WHERE form_id = $1 
            AND event_type = 'form_view'
            AND event_data->>'source' = 'qr_code'
        `, [formId]);

        // Get QR code events
        const eventsResult = await pool.query(`
            SELECT event_type, event_data, timestamp
            FROM analytics_events 
            WHERE form_id = $1 
            AND event_type IN ('qr_code_generated', 'qr_code_regenerated', 'qr_code_status_changed')
            ORDER BY timestamp DESC
            LIMIT 10
        `, [formId]);

        // Get conversion rate (scans to submissions)
        const submissionsResult = await pool.query(`
            SELECT COUNT(*) as submissions
            FROM feedback_entries fe
            JOIN feedback_forms ff ON fe.form_id = ff.id
            WHERE ff.id = $1
            AND fe.created_at >= NOW() - INTERVAL '30 days'
        `, [formId]);

        const totalScans = parseInt(totalScansResult.rows[0].total_scans);
        const totalSubmissions = parseInt(submissionsResult.rows[0].submissions);
        const conversionRate = totalScans > 0 ? ((totalSubmissions / totalScans) * 100).toFixed(2) : 0;

        return {
            totalScans,
            totalSubmissions,
            conversionRate: parseFloat(conversionRate),
            dailyScans: scansResult.rows,
            recentEvents: eventsResult.rows,
            analytics: {
                last30Days: scansResult.rows.reduce((sum, day) => sum + parseInt(day.scans), 0),
                averagePerDay: scansResult.rows.length > 0 ? 
                    (scansResult.rows.reduce((sum, day) => sum + parseInt(day.scans), 0) / 30).toFixed(1) : 0
            }
        };

    } catch (error) {
        console.error('Error getting QR code analytics:', error);
        throw error;
    }
}

/**
 * Bulk generate QR codes for multiple forms
 * @param {Array} formIds - Array of form IDs
 * @param {Object} options - QR code options
 * @returns {Array} - Array of QR code results
 */
async function bulkGenerateQRCodes(formIds, options = {}) {
    try {
        const results = [];
        
        for (const formId of formIds) {
            try {
                const qrCode = await generateFormQRCode(formId, options);
                results.push({ formId, success: true, qrCode });
            } catch (error) {
                results.push({ formId, success: false, error: error.message });
            }
        }

        return results;

    } catch (error) {
        console.error('Error bulk generating QR codes:', error);
        throw error;
    }
}

/**
 * Get customizable QR code options
 * @returns {Object} - Available QR code customization options
 */
function getQRCodeCustomizationOptions() {
    return {
        errorCorrectionLevels: ['L', 'M', 'Q', 'H'],
        sizes: [
            { label: 'Small (128px)', value: 128 },
            { label: 'Medium (256px)', value: 256 },
            { label: 'Large (512px)', value: 512 },
            { label: 'Extra Large (1024px)', value: 1024 }
        ],
        formats: ['png', 'jpeg', 'svg'],
        colorPresets: [
            { name: 'Classic', dark: '#000000', light: '#FFFFFF' },
            { name: 'Blue', dark: '#1E40AF', light: '#EFF6FF' },
            { name: 'Green', dark: '#166534', light: '#F0FDF4' },
            { name: 'Purple', dark: '#7C3AED', light: '#FAF5FF' },
            { name: 'Red', dark: '#DC2626', light: '#FEF2F2' }
        ],
        margins: [0, 1, 2, 3, 4],
        qualityLevels: [0.3, 0.6, 0.92, 1.0]
    };
}

/**
 * Cleanup expired QR codes (to be run by cron job)
 */
async function cleanupExpiredQRCodes() {
    try {
        const result = await pool.query(`
            UPDATE feedback_forms 
            SET qr_code_active = false 
            WHERE expiry_date IS NOT NULL 
            AND expiry_date <= NOW() 
            AND qr_code_active = true
            RETURNING id, title
        `);

        if (result.rows.length > 0) {
            console.log(`Deactivated ${result.rows.length} expired QR codes`);
            
            // Log cleanup
            for (const form of result.rows) {
                await pool.query(`
                    INSERT INTO analytics_events (form_id, event_type, event_data, timestamp)
                    VALUES ($1, 'qr_code_expired', $2, NOW())
                `, [form.id, JSON.stringify({ 
                    expiredAt: new Date().toISOString(),
                    formTitle: form.title
                })]);
            }
        }

        return { cleanedUp: result.rows.length };

    } catch (error) {
        console.error('Error cleaning up expired QR codes:', error);
        throw error;
    }
}

module.exports = {
    generateFormQRCode,
    getFormQRCode,
    regenerateFormQRCode,
    toggleQRCodeStatus,
    setQRCodeExpiry,
    getQRCodeAnalytics,
    bulkGenerateQRCodes,
    getQRCodeCustomizationOptions,
    cleanupExpiredQRCodes
};
