const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  aboutPageContent: {
    heroTitle: { type: String, default: 'Crafting Elegance' },
    heroSubtitle: { type: String, default: 'Our Story & Legacy' },
    story: { type: String, default: 'Founded with a passion for luxury and fine craftsmanship, NKYLUXURY specializes in high-end bespoke jewelry, custom designs, and premium watches.' },
    mission: { type: String, default: 'To define luxury and prestige in African craftsmanship.' },
    vision: { type: String, default: 'To be the ultimate global luxury brand representing African excellence.' },
    image: { type: String, default: '' }
  },
  contactInfo: {
    email: { type: String, default: 'info@nkyluxury.com' },
    phone: { type: String, default: '+234 7051530996' },
    address: { type: String, default: 'No physical showroom (Online Consultation Only)' },
    instagram: { type: String, default: 'nkyluxury' },
    facebook: { type: String, default: 'nkyluxury' },
    twitter: { type: String, default: 'nkyluxury' }
  },
  shippingFees: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
