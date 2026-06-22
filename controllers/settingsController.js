const Settings = require('../models/Settings');
const { uploadSingleImage, deleteImage } = require('../utils/cloudinary');

// Helper to get or create settings document
const getOrCreateSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({
      aboutPageContent: {
        heroTitle: 'Crafting Elegance',
        heroSubtitle: 'Our Story & Legacy',
        story: 'Founded with a passion for luxury and fine craftsmanship, NKYLUXURY specializes in high-end bespoke jewelry, custom designs, and premium watches.',
        mission: 'To define luxury and prestige in African craftsmanship.',
        vision: 'To be the ultimate global luxury brand representing African excellence.',
        image: ''
      },
      contactInfo: {
        email: 'info@nkyluxury.com',
        phone: '+234 7051530996',
        address: 'No physical showroom (Online Consultation Only)',
        instagram: 'nkylux_',
        facebook: 'nkyluxury',
        twitter: 'nkyluxury'
      },
      shippingFees: 0
    });
  }
  return settings;
};

// @desc    Get website settings (about, contact, shipping)
// @route   GET /api/settings
// @access  Public
exports.getSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    res.status(200).json({
      status: 'success',
      settings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update website settings (about, contact, shipping)
// @route   PUT /api/settings
// @access  Private/Admin
exports.updateSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    
    // Process input body structure
    // Since request body might contain nested objects (aboutPageContent, contactInfo) as JSON strings or flattened fields (because of multipart form upload), let's parse them.
    let aboutPageData = {};
    let contactInfoData = {};
    
    if (req.body.aboutPageContent) {
      aboutPageData = typeof req.body.aboutPageContent === 'string' 
        ? JSON.parse(req.body.aboutPageContent) 
        : req.body.aboutPageContent;
    }
    
    if (req.body.contactInfo) {
      contactInfoData = typeof req.body.contactInfo === 'string' 
        ? JSON.parse(req.body.contactInfo) 
        : req.body.contactInfo;
    }

    // Direct fallback if user sends flat values
    if (req.body.story) aboutPageData.story = req.body.story;
    if (req.body.heroTitle) aboutPageData.heroTitle = req.body.heroTitle;
    if (req.body.heroSubtitle) aboutPageData.heroSubtitle = req.body.heroSubtitle;
    if (req.body.mission) aboutPageData.mission = req.body.mission;
    if (req.body.vision) aboutPageData.vision = req.body.vision;
    
    if (req.body.email) contactInfoData.email = req.body.email;
    if (req.body.phone) contactInfoData.phone = req.body.phone;
    if (req.body.address) contactInfoData.address = req.body.address;
    if (req.body.instagram) contactInfoData.instagram = req.body.instagram;
    if (req.body.facebook) contactInfoData.facebook = req.body.facebook;
    if (req.body.twitter) contactInfoData.twitter = req.body.twitter;

    const shippingFees = req.body.shippingFees !== undefined ? Number(req.body.shippingFees) : settings.shippingFees;

    // Handle Image Upload for About Page Image
    let imageUrl = settings.aboutPageContent.image;
    if (req.file) {
      // Delete old about image
      if (settings.aboutPageContent.image) {
        try {
          await deleteImage(settings.aboutPageContent.image);
        } catch (delErr) {
          console.error(`Failed to delete old about image: ${delErr.message}`);
        }
      }

      const uploadRes = await uploadSingleImage(req.file.buffer, 'settings');
      imageUrl = uploadRes.secure_url;
    }

    // Merge changes
    settings.aboutPageContent = {
      ...settings.aboutPageContent.toObject(),
      ...aboutPageData,
      image: imageUrl
    };

    settings.contactInfo = {
      ...settings.contactInfo.toObject(),
      ...contactInfoData
    };

    settings.shippingFees = shippingFees;

    await settings.save();

    res.status(200).json({
      status: 'success',
      message: 'Website settings updated successfully',
      settings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit contact inquiry form and email it to the business owner
// @route   POST /api/settings/contact
// @access  Public
exports.submitContactForm = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ status: 'error', message: 'Please provide name, email, subject, and message' });
    }

    const settings = await getOrCreateSettings();
    const recipientEmail = settings.contactInfo.email || 'info@nkyluxury.com';

    // Send email using nodemailer via our transporter setup
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const luxuryHeader = `
      <div style="background-color: #000000; padding: 30px; text-align: center;">
        <h1 style="color: #D4AF37; font-family: 'Playfair Display', Georgia, serif; letter-spacing: 4px; margin: 0; font-size: 28px;">N K Y L U X U R Y</h1>
        <p style="color: #FFFFFF; font-family: 'Montserrat', sans-serif; letter-spacing: 2px; margin: 5px 0 0 0; font-size: 10px; text-transform: uppercase;">Concierge Inquiry</p>
      </div>
    `;

    const html = `
      <div style="max-width: 600px; margin: 0 auto; border: 1px solid #E5DCC6; font-family: Georgia, serif; line-height: 1.6;">
        ${luxuryHeader}
        <div style="padding: 40px 30px; background-color: #FFFFFF; color: #333333;">
          <h2 style="font-family: Georgia, serif; font-size: 20px; color: #000000; border-bottom: 1px solid #EEEEEE; padding-bottom: 10px;">New Inquiry Received</h2>
          <p><strong>Client Name:</strong> ${name}</p>
          <p><strong>Client Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <div style="background-color: #F8F5F0; padding: 20px; border-left: 3px solid #D4AF37; font-style: italic; margin-top: 15px; font-size: 14px;">
            ${message.replace(/\n/g, '<br/>')}
          </div>
        </div>
        <div style="background-color: #F8F5F0; padding: 20px; text-align: center; font-size: 11px; color: #777777;">
          This message was sent from the NKYLUXURY contact form.
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || `NKYLUXURY Contact Form <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      replyTo: email,
      subject: `[Contact Form] ${subject} - ${name}`,
      html
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      status: 'success',
      message: 'Your inquiry has been successfully sent to the concierge!'
    });
  } catch (err) {
    next(err);
  }
};
