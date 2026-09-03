require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const userModel = require('../models/user.model');
const accountModel = require('../models/account.model');

async function seedAdmin() {
  try {
    await connectDB();

    const adminEmail = 'admin@ledger.internal';
    let adminUser = await userModel.findOne({ email: adminEmail }).select('+systemUser');

    if (!adminUser) {
      adminUser = await userModel.create({
        name: 'System Admin',
        email: adminEmail,
        password: 'adminpassword123',
        systemUser: true,
      });
      console.log('✅ Admin user created:', adminEmail);
    } else {
      console.log('ℹ️ Admin user already exists:', adminEmail);
    }

    let adminAccount = await accountModel.findOne({ user: adminUser._id });
    if (!adminAccount) {
      adminAccount = await accountModel.create({
        user: adminUser._id,
        status: 'ACTIVE',
        currency: 'INR',
      });
      console.log('✅ Admin System Account created:', adminAccount._id);
    } else {
      console.log('ℹ️ Admin Account already exists:', adminAccount._id);
    }

    console.log('\n--- Admin Seed Summary ---');
    console.log('Email:', adminEmail);
    console.log('Password:', 'adminpassword123');
    console.log('System User Flag:', true);
    console.log('System Account ID:', adminAccount._id);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding admin:', err);
    process.exit(1);
  }
}

seedAdmin();
