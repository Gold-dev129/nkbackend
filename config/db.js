const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Auto-seed Admin User
    try {
      const User = require('../models/User');
      let adminUser = await User.findOne({ email: 'alterraszn@gmail.com' });
      if (!adminUser) {
        console.log('Seeding admin user: alterraszn@gmail.com');
        adminUser = new User({
          name: 'Alterra Admin',
          email: 'alterraszn@gmail.com',
          password: 'alterra2121',
          role: 'admin'
        });
        await adminUser.save();
        console.log('Admin user seeded successfully!');
      } else {
        // Ensure role is admin and password is reset to alterra2121
        adminUser.role = 'admin';
        adminUser.password = 'alterra2121';
        await adminUser.save();
        console.log('Admin user verified and updated.');
      }
    } catch (seedError) {
      console.error(`Failed to seed admin user: ${seedError.message}`);
    }

  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.warn(`WARNING: Server is running without active database connection.`);
  }
};

module.exports = connectDB;
