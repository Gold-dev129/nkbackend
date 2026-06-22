const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://alterraszn_db_user:XZSgp6TxYBJF078i@cluster0.k1vt3wu.mongodb.net/nkyluxury?retryWrites=true&w=majority&appName=Cluster0';

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB.');
    const user = await User.findOne({ email: 'ajaniadenike8@gmail.com' }).select('+password');
    if (!user) {
      console.log('User not found in database.');
    } else {
      console.log('Original Role:', user.role);
      user.role = 'admin';
      
      // Prevent password re-hashing if not modified
      user.password = 'nkluxury@301'; // Let's explicitly set the password to nkluxury@301 to ensure it is clean and matches
      
      await user.save();
      console.log('Updated User Details:');
      console.log('ID:', user._id);
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('IsBanned:', user.isBanned);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
