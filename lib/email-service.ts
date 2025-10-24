import nodemailer from 'nodemailer';

const requiredEmailVars = ['SMTP_USER', 'SMTP_PASS'];
const missingEmailVars = requiredEmailVars.filter(varName => !process.env[varName]);



const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', 
  auth: missingEmailVars.length === 0 ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
};


const transporter = nodemailer.createTransport(emailConfig);


transporter.verify((error, success) => {
  if (error) {
    console.error('Email service configuration error:', error);
  } else {
    console.log('Email service is ready to send messages');
  }
});

export interface EmailOTPData {
  email: string;
  otp: string;
  type: 'sign-in' | 'email-verification' | 'forget-password';
}

export async function sendOTPEmail({ email, otp, type }: EmailOTPData): Promise<void> {
  if (missingEmailVars.length > 0) {
    throw new Error('Email service not configured. Please add SMTP settings to .env file.');
  }

  try {
    let subject: string;
    let htmlContent: string;
    let textContent: string;

    switch (type) {
      case 'sign-in':
        subject = 'Your Sign-In Verification Code';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Sign In to Your Account</h2>
            <p>Use the verification code below to sign in to your account:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007AFF; font-size: 32px; margin: 0; letter-spacing: 4px;">${otp}</h1>
            </div>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
        `;
        textContent = `Your sign-in verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this email.`;
        break;

      case 'email-verification':
        subject = 'Verify Your Email Address';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verify Your Email Address</h2>
            <p>Please use the verification code below to verify your email address:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #34C759; font-size: 32px; margin: 0; letter-spacing: 4px;">${otp}</h1>
            </div>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
          </div>
        `;
        textContent = `Your email verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this verification, please ignore this email.`;
        break;

      case 'forget-password':
        subject = 'Reset Your Password';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p>Use the verification code below to reset your password:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #FF9500; font-size: 32px; margin: 0; letter-spacing: 4px;">${otp}</h1>
            </div>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't request a password reset, please ignore this email.</p>
          </div>
        `;
        textContent = `Your password reset code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request a password reset, please ignore this email.`;
        break;

      default:
        subject = 'Your Verification Code';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verification Code</h2>
            <p>Your verification code is:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007AFF; font-size: 32px; margin: 0; letter-spacing: 4px;">${otp}</h1>
            </div>
            <p>This code will expire in 5 minutes.</p>
          </div>
        `;
        textContent = `Your verification code is: ${otp}\n\nThis code will expire in 5 minutes.`;
    }

    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${email}:`, info.messageId);
    
  } catch (error) {
    console.error(`Failed to send email to ${email}:`, error);
    throw error;
  }
}

export default transporter;
