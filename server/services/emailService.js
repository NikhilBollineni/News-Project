/**
 * 📧 EMAIL SERVICE
 * Production-ready email service with templates
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // Check if email is configured
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('⚠️  Email service not configured. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS environment variables.');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      // Verify connection
      await this.transporter.verify();
      this.isConfigured = true;
      console.log('✅ Email service configured successfully');
    } catch (error) {
      console.log('❌ Email service configuration failed:', error.message);
      this.isConfigured = false;
    }
  }

  async sendEmail(emailData) {
    if (!this.isConfigured) {
      console.log('📧 Email service not configured, skipping email:', emailData.subject);
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const { to, subject, template, data } = emailData;
      
      // Get email template
      const html = await this.getEmailTemplate(template, data);
      
      const mailOptions = {
        from: `"Automotive News Hub" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text: this.stripHtml(html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent successfully to ${to}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      throw error;
    }
  }

  async getEmailTemplate(templateName, data) {
    try {
      const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
      
      if (!fs.existsSync(templatePath)) {
        // Return default template if custom template doesn't exist
        return this.getDefaultTemplate(templateName, data);
      }

      let template = fs.readFileSync(templatePath, 'utf8');
      
      // Replace placeholders with data
      Object.keys(data).forEach(key => {
        const placeholder = `{{${key}}}`;
        template = template.replace(new RegExp(placeholder, 'g'), data[key] || '');
      });

      return template;
    } catch (error) {
      console.error('Error loading email template:', error.message);
      return this.getDefaultTemplate(templateName, data);
    }
  }

  getDefaultTemplate(templateName, data) {
    const baseTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Automotive News Hub</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a365d; color: white; padding: 20px; text-align: center; }
          .content { background: #f8f9fa; padding: 30px; }
          .button { display: inline-block; background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background: #2d3748; color: white; padding: 20px; text-align: center; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚗 Automotive News Hub</h1>
          </div>
          <div class="content">
            {{content}}
          </div>
          <div class="footer">
            <p>&copy; 2025 Automotive News Hub. All rights reserved.</p>
            <p>This email was sent to {{email}}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    let content = '';
    
    switch (templateName) {
      case 'email-verification':
        content = `
          <h2>Welcome to Automotive News Hub!</h2>
          <p>Hi {{firstName}},</p>
          <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
          <p><a href="{{verificationUrl}}" class="button">Verify Email Address</a></p>
          <p>Or copy and paste this link into your browser:</p>
          <p>{{verificationUrl}}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        `;
        break;
        
      case 'password-reset':
        content = `
          <h2>Reset Your Password</h2>
          <p>Hi {{firstName}},</p>
          <p>You requested to reset your password. Click the button below to create a new password:</p>
          <p><a href="{{resetUrl}}" class="button">Reset Password</a></p>
          <p>Or copy and paste this link into your browser:</p>
          <p>{{resetUrl}}</p>
          <p>This link will expire in 10 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        `;
        break;
        
      case 'welcome':
        content = `
          <h2>Welcome to Automotive News Hub!</h2>
          <p>Hi {{firstName}},</p>
          <p>Your account has been successfully created and verified.</p>
          <p>You can now access all the latest automotive news and insights.</p>
          <p><a href="{{loginUrl}}" class="button">Login to Your Account</a></p>
        `;
        break;
        
      default:
        content = `
          <h2>Automotive News Hub</h2>
          <p>Hi {{firstName}},</p>
          <p>{{message}}</p>
        `;
    }

    return baseTemplate
      .replace('{{content}}', content)
      .replace('{{firstName}}', data.firstName || 'User')
      .replace('{{email}}', data.email || '')
      .replace('{{verificationUrl}}', data.verificationUrl || '')
      .replace('{{resetUrl}}', data.resetUrl || '')
      .replace('{{loginUrl}}', data.loginUrl || `${process.env.CLIENT_URL || 'http://localhost:3000'}/login`)
      .replace('{{message}}', data.message || '');
  }

  stripHtml(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

module.exports = {
  sendEmail: async (emailData) => {
    const emailService = new EmailService();
    return await emailService.sendEmail(emailData);
  }
};
