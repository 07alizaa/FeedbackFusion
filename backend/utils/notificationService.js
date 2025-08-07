// utils/notificationService.js - Notification management service
const { pool } = require('../models/db');
const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    // Initialize email transporter (you can configure this with your email provider)
            this.emailTransporter = nodemailer.createTransport({
      // Gmail configuration example
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Create a notification
  async createNotification(userId, type, title, message, data = {}) {
    try {
      const result = await pool.query(`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [userId, type, title, message, JSON.stringify(data)]);

      const notification = result.rows[0];

      // Send email notification if user preferences allow it
      await this.sendEmailNotification(userId, notification);

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get user notifications
  async getUserNotifications(userId, unreadOnly = false) {
    try {
      let query = `
        SELECT * FROM notifications 
        WHERE user_id = $1
      `;
      
      if (unreadOnly) {
        query += ' AND is_read = false';
      }
      
      query += ' ORDER BY created_at DESC LIMIT 50';

      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      await pool.query(`
        UPDATE notifications 
        SET is_read = true 
        WHERE id = $1 AND user_id = $2
      `, [notificationId, userId]);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    try {
      await pool.query(`
        UPDATE notifications 
        SET is_read = true 
        WHERE user_id = $1 AND is_read = false
      `, [userId]);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    try {
      await pool.query(`
        DELETE FROM notifications 
        WHERE id = $1 AND user_id = $2
      `, [notificationId, userId]);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Send email notification
  async sendEmailNotification(userId, notification) {
    try {
      // Get user email and preferences
      const userResult = await pool.query(`
        SELECT email, settings FROM users WHERE id = $1
      `, [userId]);

      if (userResult.rows.length === 0) return;

      const user = userResult.rows[0];
      const settings = user.settings || {};

      // Check if user wants email notifications for this type
      if (settings.emailNotifications === false) return;
      if (settings.notificationTypes && !settings.notificationTypes[notification.type]) return;

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@feedbackfusion.com',
        to: user.email,
        subject: `FeedbackFusion: ${notification.title}`,
        html: this.generateEmailTemplate(notification)
      };

      await this.emailTransporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email notification:', error);
      // Don't throw error for email failures
    }
  }

  // Generate email template
  generateEmailTemplate(notification) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${notification.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FeedbackFusion</h1>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            ${notification.data?.actionUrl ? `<a href="${notification.data.actionUrl}" class="button">Take Action</a>` : ''}
          </div>
          <div class="footer">
            <p>This is an automated message from FeedbackFusion. If you no longer wish to receive these notifications, you can update your preferences in your account settings.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Predefined notification types
  async notifyNewFeedback(userId, formTitle, feedbackCount) {
    return this.createNotification(
      userId,
      'new_feedback',
      'New Feedback Received',
      `You have received new feedback on your form "${formTitle}". Total responses: ${feedbackCount}`,
      { formTitle, feedbackCount }
    );
  }

  async notifySubscriptionExpiry(userId, daysLeft) {
    return this.createNotification(
      userId,
      'subscription_expiry',
      'Subscription Expiring Soon',
      `Your subscription will expire in ${daysLeft} days. Renew now to continue using premium features.`,
      { daysLeft, actionUrl: '/subscription' }
    );
  }

  async notifyFormApproved(userId, formTitle) {
    return this.createNotification(
      userId,
      'form_approved',
      'Form Approved',
      `Your form "${formTitle}" has been approved and is now live.`,
      { formTitle }
    );
  }

  async notifyFormRejected(userId, formTitle, reason) {
    return this.createNotification(
      userId,
      'form_rejected',
      'Form Rejected',
      `Your form "${formTitle}" was rejected. Reason: ${reason}`,
      { formTitle, reason }
    );
  }

  async notifySpamDetected(userId, formTitle, spamCount) {
    return this.createNotification(
      userId,
      'spam_detected',
      'Spam Detected',
      `${spamCount} spam responses were detected and blocked on form "${formTitle}".`,
      { formTitle, spamCount }
    );
  }

  async notifyUsageLimitReached(userId, limitType) {
    return this.createNotification(
      userId,
      'usage_limit',
      'Usage Limit Reached',
      `You have reached your ${limitType} limit for this month. Upgrade your plan to continue.`,
      { limitType, actionUrl: '/subscription' }
    );
  }

  async notifySecurityAlert(userId, alertType, details) {
    return this.createNotification(
      userId,
      'security_alert',
      'Security Alert',
      `Security alert: ${alertType}. ${details}`,
      { alertType, details, actionUrl: '/settings/security' }
    );
  }

  // Clean up old notifications (older than 30 days)
  async cleanupOldNotifications() {
    try {
      await pool.query(`
        DELETE FROM notifications 
        WHERE created_at < NOW() - INTERVAL '30 days'
      `);
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  }

  // Get notification statistics
  async getNotificationStats(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_read = false THEN 1 END) as unread,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h
        FROM notifications 
        WHERE user_id = $1
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }

  async getUnreadCount(userId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM notifications 
        WHERE user_id = $1 AND is_read = false
      `;
      
      const result = await pool.query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  async getUserPreferences(userId) {
    try {
      const query = `
        SELECT * FROM notification_preferences 
        WHERE user_id = $1
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows[0] || {
        email_enabled: false,
        in_app_enabled: true,
        feedback_notifications: true,
        review_notifications: true,
        admin_notifications: false
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw error;
    }
  }

  async updateUserPreferences(userId, preferences) {
    try {
      const query = `
        INSERT INTO notification_preferences (user_id, email_enabled, in_app_enabled, feedback_notifications, review_notifications, admin_notifications)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          email_enabled = EXCLUDED.email_enabled,
          in_app_enabled = EXCLUDED.in_app_enabled,
          feedback_notifications = EXCLUDED.feedback_notifications,
          review_notifications = EXCLUDED.review_notifications,
          admin_notifications = EXCLUDED.admin_notifications,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        userId,
        preferences.email_enabled || false,
        preferences.in_app_enabled || true,
        preferences.feedback_notifications || true,
        preferences.review_notifications || true,
        preferences.admin_notifications || false
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
