const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const cron = require('node-cron');
const amqp = require('amqplib');
require('dotenv').config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 3007;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Initialize email transporter
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Initialize Twilio client (optional - only if credentials provided)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  console.log('Twilio client initialized successfully');
} else {
  console.warn('⚠️ Twilio credentials not found - SMS notifications will be disabled');
}

// RabbitMQ connection
let connection;
let channel;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const NOTIFICATION_QUEUE = 'notifications';
const EMAIL_QUEUE = 'email_notifications';
const SMS_QUEUE = 'sms_notifications';

// Initialize RabbitMQ
async function initRabbitMQ() {
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // Declare queues
    await channel.assertQueue(NOTIFICATION_QUEUE, { durable: true });
    await channel.assertQueue(EMAIL_QUEUE, { durable: true });
    await channel.assertQueue(SMS_QUEUE, { durable: true });
    
    console.log('RabbitMQ connected successfully');
    
    // Start consuming messages
    await consumeNotifications();
    await consumeEmailNotifications();
    await consumeSMSNotifications();
    
  } catch (error) {
    console.error('RabbitMQ connection failed:', error);
    // Fallback to direct processing if RabbitMQ is not available
  }
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Validation schemas
const sendNotificationSchema = Joi.object({
  userId: Joi.number().required(),
  type: Joi.string().valid('email', 'sms', 'push').required(),
  subject: Joi.string().optional(),
  message: Joi.string().required(),
  data: Joi.object().optional()
});

const updatePreferencesSchema = Joi.object({
  emailNotifications: Joi.boolean().optional(),
  smsNotifications: Joi.boolean().optional(),
  pushNotifications: Joi.boolean().optional(),
  bookingReminders: Joi.boolean().optional(),
  messageNotifications: Joi.boolean().optional(),
  reviewReminders: Joi.boolean().optional()
});

// Helper functions
async function sendEmail(to, subject, html, text) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@tutorconnect.sg',
      to,
      subject,
      html,
      text
    };

    const result = await emailTransporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

async function sendSMS(to, message) {
  if (!twilioClient) {
    console.warn('SMS sending skipped - Twilio not configured');
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+65${to}` // Singapore phone number format
    });

    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error: error.message };
  }
}

async function sendPushNotification(userId, title, body, data = {}) {
  try {
    // Get user's push tokens
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId);

    if (!tokens || tokens.length === 0) {
      return { success: false, error: 'No push tokens found' };
    }

    // In a real implementation, you would use a service like Firebase Cloud Messaging
    // For now, we'll just log the notification
    console.log(`Push notification to user ${userId}: ${title} - ${body}`);
    
    return { success: true };
  } catch (error) {
    console.error('Push notification error:', error);
    return { success: false, error: error.message };
  }
}

// Routes
app.post('/notifications/send', verifyToken, async (req, res) => {
  try {
    const { error, value } = sendNotificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { userId, type, subject, message, data } = value;

    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('email, phone, first_name')
      .eq('id', userId)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let result;

    switch (type) {
      case 'email':
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">TutorConnect</h2>
            <p>Hello ${user.first_name},</p>
            <p>${message}</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              This is an automated message from TutorConnect. Please do not reply to this email.
            </p>
          </div>
        `;
        result = await sendEmail(user.email, subject || 'TutorConnect Notification', emailHtml, message);
        break;

      case 'sms':
        result = await sendSMS(user.phone, message);
        break;

      case 'push':
        result = await sendPushNotification(userId, subject || 'TutorConnect', message, data);
        break;

      default:
        return res.status(400).json({ error: 'Invalid notification type' });
    }

    // Save notification to database
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        subject: subject || 'TutorConnect Notification',
        message,
        data,
        status: result.success ? 'sent' : 'failed',
        sent_at: result.success ? new Date().toISOString() : null,
        created_at: new Date().toISOString()
      });

    if (result.success) {
      res.json({ message: 'Notification sent successfully', result });
    } else {
      res.status(500).json({ error: 'Failed to send notification', details: result.error });
    }
  } catch (error) {
    console.error('Notification send error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/notifications/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, type } = req.query;

    // Check if user can access these notifications
    if (req.user.userId !== parseInt(userId) && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const offset = (page - 1) * limit;
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);

    if (type) {
      query = query.eq('type', type);
    }

    const { data: notifications, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({ notifications });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', req.user.userId);

    if (error) {
      throw error;
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/notifications/preferences/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.userId !== parseInt(userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }

    res.json({ preferences: preferences || {} });
  } catch (error) {
    console.error('Preferences fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/notifications/preferences/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { error, value } = updatePreferencesSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    if (req.user.userId !== parseInt(userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { data: preferences, error: upsertError } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...value,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (upsertError) {
      throw upsertError;
    }

    res.json({
      message: 'Preferences updated successfully',
      preferences
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Booking reminder notifications
app.post('/notifications/booking-reminder', async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Get booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        students:student_id (
          first_name,
          last_name,
          email,
          phone
        ),
        tutors:tutor_id (
          first_name,
          last_name
        )
      `)
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check user preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', booking.student_id)
      .single();

    const shouldSendEmail = !preferences || preferences.email_notifications !== false;
    const shouldSendSMS = !preferences || preferences.sms_notifications !== false;

    const reminderMessage = `Reminder: You have a tutoring session with ${booking.tutors.first_name} ${booking.tutors.last_name} tomorrow at ${new Date(booking.start_time).toLocaleString()}.`;

    if (shouldSendEmail) {
      await sendEmail(
        booking.students.email,
        'Tutoring Session Reminder',
        `<p>${reminderMessage}</p>`,
        reminderMessage
      );
    }

    if (shouldSendSMS && booking.students.phone) {
      await sendSMS(booking.students.phone, reminderMessage);
    }

    res.json({ message: 'Reminder sent successfully' });
  } catch (error) {
    console.error('Booking reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cron job for booking reminders (runs daily at 6 PM)
cron.schedule('0 18 * * *', async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0));
    const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999));

    // Get bookings for tomorrow
    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        *,
        students:student_id (
          first_name,
          last_name,
          email,
          phone
        ),
        tutors:tutor_id (
          first_name,
          last_name
        )
      `)
      .eq('status', 'confirmed')
      .gte('start_time', tomorrowStart.toISOString())
      .lte('start_time', tomorrowEnd.toISOString());

    if (bookings) {
      for (const booking of bookings) {
        // Check if reminder already sent
        const { data: existingReminder } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', booking.student_id)
          .eq('type', 'email')
          .like('message', '%Reminder:%')
          .gte('created_at', new Date().toISOString().split('T')[0]);

        if (!existingReminder) {
          const reminderMessage = `Reminder: You have a tutoring session with ${booking.tutors.first_name} ${booking.tutors.last_name} tomorrow at ${new Date(booking.start_time).toLocaleString()}.`;
          
          await sendEmail(
            booking.students.email,
            'Tutoring Session Reminder',
            `<p>${reminderMessage}</p>`,
            reminderMessage
          );
        }
      }
    }
  } catch (error) {
    console.error('Cron job error:', error);
  }
});

// RabbitMQ Consumer Functions
async function consumeNotifications() {
  if (!channel) return;
  
  await channel.consume(NOTIFICATION_QUEUE, async (msg) => {
    if (msg) {
      try {
        const notification = JSON.parse(msg.content.toString());
        console.log('Processing notification:', notification);
        
        // Store notification in database
        await supabase
          .from('notifications')
          .insert({
            user_id: notification.userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            created_at: new Date().toISOString()
          });
        
        // Send to appropriate queue based on type
        if (notification.channels.includes('email')) {
          await channel.sendToQueue(EMAIL_QUEUE, Buffer.from(JSON.stringify(notification)));
        }
        if (notification.channels.includes('sms')) {
          await channel.sendToQueue(SMS_QUEUE, Buffer.from(JSON.stringify(notification)));
        }
        
        channel.ack(msg);
      } catch (error) {
        console.error('Error processing notification:', error);
        channel.nack(msg, false, false);
      }
    }
  });
}

async function consumeEmailNotifications() {
  if (!channel) return;
  
  await channel.consume(EMAIL_QUEUE, async (msg) => {
    if (msg) {
      try {
        const notification = JSON.parse(msg.content.toString());
        await sendEmail(notification);
        channel.ack(msg);
      } catch (error) {
        console.error('Error sending email:', error);
        channel.nack(msg, false, false);
      }
    }
  });
}

async function consumeSMSNotifications() {
  if (!channel) return;
  
  await channel.consume(SMS_QUEUE, async (msg) => {
    if (msg) {
      try {
        const notification = JSON.parse(msg.content.toString());
        await sendSMS(notification);
        channel.ack(msg);
      } catch (error) {
        console.error('Error sending SMS:', error);
        channel.nack(msg, false, false);
      }
    }
  });
}

// Helper functions for sending notifications
async function sendEmail(notification) {
  try {
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@tutorconnect.sg',
      to: notification.email,
      subject: notification.title,
      html: `
        <h2>${notification.title}</h2>
        <p>${notification.message}</p>
        <p>Best regards,<br>TutorConnect Team</p>
      `
    };
    
    await emailTransporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', notification.email);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

async function sendSMS(notification) {
  if (!twilioClient) {
    console.warn('SMS sending skipped - Twilio not configured');
    return;
  }

  try {
    const message = await twilioClient.messages.create({
      body: `${notification.title}\n\n${notification.message}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: notification.phone
    });

    console.log('SMS sent successfully:', message.sid);
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw error;
  }
}

// Publish notification to RabbitMQ
async function publishNotification(notification) {
  if (channel) {
    await channel.sendToQueue(NOTIFICATION_QUEUE, Buffer.from(JSON.stringify(notification)), {
      persistent: true
    });
  } else {
    // Fallback to direct processing
    await processNotificationDirectly(notification);
  }
}

async function processNotificationDirectly(notification) {
  try {
    // Store in database
    await supabase
      .from('notifications')
      .insert({
        user_id: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        created_at: new Date().toISOString()
      });
    
    // Send notifications directly
    if (notification.channels.includes('email')) {
      await sendEmail(notification);
    }
    if (notification.channels.includes('sms')) {
      await sendSMS(notification);
    }
  } catch (error) {
    console.error('Direct notification processing failed:', error);
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'notifications',
    rabbitmq: connection ? 'connected' : 'disconnected'
  });
});

// Initialize RabbitMQ and start server
initRabbitMQ().then(() => {
  app.listen(PORT, () => {
    console.log(`Notifications service running on port ${PORT}`);
  });
}).catch(error => {
  console.error('Failed to initialize:', error);
  app.listen(PORT, () => {
    console.log(`Notifications service running on port ${PORT} (without RabbitMQ)`);
  });
});
