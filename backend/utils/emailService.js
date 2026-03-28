const nodemailer = require('nodemailer');

function isEmailConfigured() {
  return Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

function createTransporter() {
  if (!isEmailConfigured()) {
    return {
      sendMail: async ({ to, subject }) => {
        console.log(`Email skipped for ${to}: ${subject}`);
        return { messageId: 'email-disabled' };
      },
    };
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendStatusChangeEmail(toEmail, userName, jobTitle, company, oldStatus, newStatus) {
  try {
    const transporter = createTransporter();

    const statusColors = {
      Applied: '#3B82F6',
      Interview: '#F59E0B',
      Offer: '#10B981',
      Rejected: '#EF4444',
    };

    const statusLabels = {
      Applied: '[Applied]',
      Interview: '[Interview]',
      Offer: '[Offer]',
      Rejected: '[Rejected]',
    };

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
  <div style="background: #1e293b; padding: 32px; text-align: center;">
    <h1 style="color: #f1f5f9; margin: 0; font-size: 24px;">JobTracker</h1>
  </div>
  <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px;">
    <h2 style="color: #1e293b; margin-top: 0;">Application Status Update ${statusLabels[newStatus]}</h2>
    <p style="color: #64748b;">Hi ${userName},</p>
    <p style="color: #64748b;">Your application status has been updated:</p>
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Position</p>
      <p style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #1e293b;">${jobTitle}</p>
      <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Company</p>
      <p style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #1e293b;">${company}</p>
      <div style="display: flex; align-items: center; gap: 12px; margin-top: 20px;">
        <span style="background: #e2e8f0; color: #64748b; padding: 6px 14px; border-radius: 20px; font-size: 14px;">${oldStatus}</span>
        <span style="color: #94a3b8;">-&gt;</span>
        <span style="background: ${statusColors[newStatus]}20; color: ${statusColors[newStatus]}; padding: 6px 14px; border-radius: 20px; font-size: 14px; font-weight: 600;">${newStatus}</span>
      </div>
    </div>
    <p style="color: #64748b; font-size: 14px;">Log in to your dashboard to add notes or update your application.</p>
    <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">This is an automated notification from JobTracker.</p>
  </div>
</body>
</html>`;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"JobTracker" <no-reply@jobtracker.com>',
      to: toEmail,
      subject: `${statusLabels[newStatus]} Application Update: ${jobTitle} at ${company}`,
      html: htmlContent,
      text: `Hi ${userName}, your application for ${jobTitle} at ${company} has been updated from ${oldStatus} to ${newStatus}.`,
    });

    if (!isEmailConfigured()) {
      console.log(`Email notification skipped: ${oldStatus} -> ${newStatus} for ${jobTitle} at ${company}`);
      console.log(`To: ${toEmail}`);
    }

    return info;
  } catch (error) {
    console.error('Email send failed:', error.message);
    return null;
  }
}

async function sendWelcomeEmail(toEmail, userName) {
  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"JobTracker" <no-reply@jobtracker.com>',
      to: toEmail,
      subject: 'Welcome to JobTracker!',
      text: `Hi ${userName}, welcome to JobTracker! Start tracking your job applications today.`,
    });

    if (!isEmailConfigured()) {
      console.log(`Welcome email skipped for ${toEmail}`);
    }
  } catch (error) {
    console.error('Welcome email failed:', error.message);
  }
}

module.exports = { sendStatusChangeEmail, sendWelcomeEmail };
