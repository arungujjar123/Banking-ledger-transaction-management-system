require('dotenv').config();
const connectDB = require('../config/db');
const { ensureAdminUser } = require('../services/seed.service');

async function seedAdmin() {
  try {
    await connectDB();

    const result = await ensureAdminUser();

    if (!result) {
      console.error('❌ Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding');
      process.exit(1);
    }

    console.log('\n--- Admin Seed Summary ---');
    console.log('Email:', result.adminUser.email);
    console.log('System Account ID:', result.adminAccount._id.toString());

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding admin:', err);
    process.exit(1);
  }
}

seedAdmin();
