const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Luxury styling variables
const luxuryHeader = `
  <div style="background-color: #000000; padding: 30px; text-align: center;">
    <h1 style="color: #D4AF37; font-family: 'Playfair Display', Georgia, serif; letter-spacing: 4px; margin: 0; font-size: 28px;">N K Y L U X U R Y</h1>
    <p style="color: #FFFFFF; font-family: 'Montserrat', sans-serif; letter-spacing: 2px; margin: 5px 0 0 0; font-size: 10px; text-transform: uppercase;">Exquisite Fine Jewelry</p>
  </div>
`;

const luxuryFooter = `
  <div style="background-color: #F8F5F0; padding: 25px; text-align: center; font-family: 'Montserrat', sans-serif; font-size: 11px; color: #555555; border-top: 1px solid #E5DCC6;">
    <p style="margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">NKYLUXURY Store</p>
    <p style="margin: 5px 0;">Lekki Phase 1, Lagos, Nigeria | support@nkyluxury.com</p>
    <p style="margin: 10px 0 0 0; color: #999999;">&copy; ${new Date().getFullYear()} NKYLUXURY. All Rights Reserved.</p>
  </div>
`;

const sendEmail = async (options) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'NKYLUXURY <noreply@nkyluxury.com>',
    to: options.email,
    subject: options.subject,
    html: options.html
  };

  await transporter.sendMail(mailOptions);
};

// 1. Welcome Email
const sendWelcomeEmail = async (email, name) => {
  const html = `
    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #E5DCC6; font-family: Georgia, serif;">
      ${luxuryHeader}
      <div style="padding: 40px 30px; background-color: #FFFFFF; color: #333333; line-height: 1.6;">
        <h2 style="font-family: Georgia, serif; font-size: 22px; text-align: center; color: #000000; margin-bottom: 20px;">Welcome to the Elite Circle, ${name}</h2>
        <p>Thank you for registering an account with <strong>NKYLUXURY</strong>. We are thrilled to welcome you into our world of exceptional quality and timeless design.</p>
        <p>From custom-tailored designs to rare collections, we source and craft only the finest gold, silver, and precious stones to bring you luxury that makes a statement.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/shop" style="background-color: #000000; color: #D4AF37; padding: 15px 30px; text-decoration: none; font-weight: bold; border: 1px solid #D4AF37; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">Explore Collections</a>
        </div>
        <p>If you have any questions or require custom consultation, please don't hesitate to contact our private client services.</p>
        <p>Sincerely,<br/><strong>The NKYLUXURY Team</strong></p>
      </div>
      ${luxuryFooter}
    </div>
  `;

  await sendEmail({
    email,
    subject: 'Welcome to NKYLUXURY - Exquisite Fine Jewelry',
    html
  });
};

// 2. Order Confirmation Email
const sendOrderConfirmationEmail = async (email, name, order) => {
  const itemsHtml = order.orderItems.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #EEEEEE; font-size: 14px;">${item.name} (x${item.quantity})</td>
      <td style="padding: 10px; border-bottom: 1px solid #EEEEEE; font-size: 14px; text-align: right;">₦${item.price.toLocaleString()}</td>
    </tr>
  `).join('');

  const html = `
    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #E5DCC6; font-family: Georgia, serif;">
      ${luxuryHeader}
      <div style="padding: 40px 30px; background-color: #FFFFFF; color: #333333; line-height: 1.6;">
        <h2 style="font-family: Georgia, serif; font-size: 22px; text-align: center; color: #000000; margin-bottom: 20px;">Thank You For Your Order</h2>
        <p>Dear ${name},</p>
        <p>We are pleased to confirm that we have received your order. Our team of specialists is currently preparing your packaging and documentation.</p>
        <p><strong>Order ID:</strong> ${order._id}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
          <thead>
            <tr style="background-color: #F8F5F0; border-bottom: 1px solid #E5DCC6;">
              <th style="padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Item</th>
              <th style="padding: 10px; text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr>
              <td style="padding: 10px; font-weight: bold; font-size: 14px;">Subtotal</td>
              <td style="padding: 10px; font-weight: bold; font-size: 14px; text-align: right;">₦${order.itemsPrice.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-size: 14px;">Delivery Fee</td>
              <td style="padding: 10px; font-size: 14px; text-align: right; font-style: italic; color: #777777;">Paid on Delivery (TBC)</td>
            </tr>
            <tr style="border-top: 1px solid #E5DCC6;">
              <td style="padding: 10px; font-weight: bold; font-size: 16px; color: #D4AF37;">Total Paid</td>
              <td style="padding: 10px; font-weight: bold; font-size: 16px; color: #D4AF37; text-align: right;">₦${order.totalPrice.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <p><strong>Shipping Address:</strong><br/>
           ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.country}
        </p>

        <div style="margin: 20px 0; padding: 15px; border-left: 3px solid #D4AF37; background-color: #F8F5F0; font-size: 12px; line-height: 1.5;">
          <p style="margin: 0 0 8px 0;"><strong>Business Policies & Disclaimers:</strong></p>
          <p style="margin: 0 0 6px 0;">• <strong>No Refund Policy:</strong> All sales are final. We do not offer refunds for any purchased items.</p>
          <p style="margin: 0 0 6px 0;">• <strong>Delivery Timeframe:</strong> Standard delivery takes 3-10 days. For custom-made orders, the delivery timeline will be communicated directly to you once it is ready.</p>
          <p style="margin: 0;">• <strong>Delivery Fee Policy:</strong> The delivery fee is not included in your checkout total. The exact delivery fee will be calculated and communicated to you once the product is ready for delivery, and is payable directly to the courier agent upon arrival.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #000000; color: #D4AF37; padding: 15px 30px; text-decoration: none; font-weight: bold; border: 1px solid #D4AF37; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">Track Your Order</a>
        </div>

        <p>If you need to make any changes to your shipping details, please contact us immediately.</p>
      </div>
      ${luxuryFooter}
    </div>
  `;

  await sendEmail({
    email,
    subject: `NKYLUXURY Order Confirmation - ${order._id.toString().substring(0, 8)}`,
    html
  });
};

// 3. Password Reset Email
const sendPasswordResetEmail = async (email, name, resetUrl) => {
  const html = `
    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #E5DCC6; font-family: Georgia, serif;">
      ${luxuryHeader}
      <div style="padding: 40px 30px; background-color: #FFFFFF; color: #333333; line-height: 1.6;">
        <h2 style="font-family: Georgia, serif; font-size: 22px; text-align: center; color: #000000; margin-bottom: 20px;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>You are receiving this email because you (or someone else) requested a password reset for your NKYLUXURY account.</p>
        <p>Please click the button below to set a new password. This link is valid for 10 minutes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #000000; color: #D4AF37; padding: 15px 30px; text-decoration: none; font-weight: bold; border: 1px solid #D4AF37; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">Reset Password</a>
        </div>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      </div>
      ${luxuryFooter}
    </div>
  `;

  await sendEmail({
    email,
    subject: 'NKYLUXURY - Password Reset Link',
    html
  });
};

// 4. Newsletter Broadcast Email
const sendNewsletterEmail = async (emails, subject, content) => {
  const html = `
    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #E5DCC6; font-family: Georgia, serif;">
      ${luxuryHeader}
      <div style="padding: 40px 30px; background-color: #FFFFFF; color: #333333; line-height: 1.6;">
        ${content}
        <hr style="border: 0; border-top: 1px solid #E5DCC6; margin: 30px 0;"/>
        <p style="font-size: 11px; text-align: center; color: #999999;">
          You received this email because you are subscribed to NKYLUXURY. If you wish to unsubscribe, please click <a href="${process.env.FRONTEND_URL}/unsubscribe" style="color: #D4AF37;">here</a>.
        </p>
      </div>
      ${luxuryFooter}
    </div>
  `;

  const transporter = createTransporter();
  
  // Send emails individually to protect user privacy (preventing bulk lists leaking to CC/BCC)
  const emailPromises = emails.map(email => {
    return transporter.sendMail({
      from: process.env.EMAIL_FROM || 'NKYLUXURY <noreply@nkyluxury.com>',
      to: email,
      subject: subject,
      html: html
    });
  });

  await Promise.all(emailPromises);
};

module.exports = {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendPasswordResetEmail,
  sendNewsletterEmail
};
