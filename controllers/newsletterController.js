const Newsletter = require('../models/Newsletter');
const { sendNewsletterEmail } = require('../utils/email');

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
exports.subscribeNewsletter = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Please provide an email' });
    }

    let subscriber = await Newsletter.findOne({ email });

    if (subscriber) {
      if (subscriber.isActive) {
        return res.status(400).json({ status: 'error', message: 'You are already subscribed to our newsletter' });
      } else {
        subscriber.isActive = true;
        await subscriber.save();
      }
    } else {
      subscriber = await Newsletter.create({ email });
    }

    res.status(200).json({
      status: 'success',
      message: 'Subscribed to newsletter successfully!'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Unsubscribe from newsletter
// @route   POST /api/newsletter/unsubscribe
// @access  Public
exports.unsubscribeNewsletter = async (req, res, next) => {
  try {
    const { email } = req.body;

    const subscriber = await Newsletter.findOne({ email });
    if (!subscriber) {
      return res.status(404).json({ status: 'error', message: 'Email not found in subscriptions' });
    }

    subscriber.isActive = false;
    await subscriber.save();

    res.status(200).json({
      status: 'success',
      message: 'Unsubscribed from newsletter successfully.'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all newsletter subscribers (Admin only)
// @route   GET /api/newsletter
// @access  Private/Admin
exports.getSubscribers = async (req, res, next) => {
  try {
    const subscribers = await Newsletter.find({ isActive: true }).sort('-createdAt');
    res.status(200).json({
      status: 'success',
      count: subscribers.length,
      subscribers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Send broadcast email to all subscribers (Admin only)
// @route   POST /api/newsletter/broadcast
// @access  Private/Admin
exports.sendBroadcast = async (req, res, next) => {
  try {
    const { subject, content } = req.body;

    if (!subject || !content) {
      return res.status(400).json({ status: 'error', message: 'Please provide subject and email content' });
    }

    const subscribers = await Newsletter.find({ isActive: true });
    
    if (subscribers.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No active subscribers found' });
    }

    const emails = subscribers.map(sub => sub.email);

    await sendNewsletterEmail(emails, subject, content);

    res.status(200).json({
      status: 'success',
      message: `Newsletter broadcasted successfully to ${emails.length} subscribers!`
    });
  } catch (err) {
    next(err);
  }
};
