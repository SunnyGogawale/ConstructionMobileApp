const connectDatabase = require('../config/database');
const {adminSeed} = require('../config/env');
const User = require('../models/User');
const ROLES = require('../constants/roles');

async function seedAdmin() {
  await connectDatabase();

  const existingAdmin = await User.findOne({
    $or: [{mobileNumber: adminSeed.mobileNumber}, {email: adminSeed.email}],
  });

  if (existingAdmin) {
    console.log('Admin user already exists');
    process.exit(0);
  }

  await User.create({
    name: adminSeed.name,
    mobileNumber: adminSeed.mobileNumber,
    email: adminSeed.email,
    password: adminSeed.password,
    role: ROLES.ADMIN,
  });

  console.log('Admin user seeded successfully');
  process.exit(0);
}

seedAdmin().catch(error => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
