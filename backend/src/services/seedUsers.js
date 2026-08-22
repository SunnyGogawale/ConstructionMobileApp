const path = require('path');
const dotenv = require('dotenv');
const connectDatabase = require('../config/database');
const User = require('../models/User');
const ROLES = require('../constants/roles');

dotenv.config({path: path.resolve(__dirname, '../../.env')});

const dummyUsers = [
  {
    name: process.env.ADMIN_NAME || 'System Admin',
    mobileNumber: process.env.ADMIN_MOBILE || '9999999999',
    email: process.env.ADMIN_EMAIL || 'admin@buildflow.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
    role: ROLES.ADMIN,
  },
  {
    name: process.env.PM_NAME || 'Project Manager',
    mobileNumber: process.env.PM_MOBILE || '8888888888',
    email: process.env.PM_EMAIL || 'pm@buildflow.com',
    password: process.env.PM_PASSWORD || 'Manager@12345',
    role: ROLES.PROJECT_MANAGER,
  },
  {
    name: process.env.WORKER_NAME || 'Site Worker',
    mobileNumber: process.env.WORKER_MOBILE || '7777777777',
    email: process.env.WORKER_EMAIL || 'worker@buildflow.com',
    password: process.env.WORKER_PASSWORD || 'Worker@12345',
    role: ROLES.WORKER,
  },
];

async function dropLegacyMobileIndexIfPresent() {
  const collection = User.collection;
  const indexes = await collection.indexes();
  const hasLegacyMobileIndex = indexes.some(index => index.name === 'mobile_1');

  if (hasLegacyMobileIndex) {
    await collection.dropIndex('mobile_1');
    console.log('Dropped legacy users.mobile_1 index');
  }
}

async function upsertUser(payload) {
  const existing = await User.findOne({
    $or: [{mobileNumber: payload.mobileNumber}, {email: payload.email}],
  }).select('+password');

  if (!existing) {
    await User.create(payload);
    return {identifier: payload.mobileNumber, action: 'created'};
  }

  existing.name = payload.name;
  existing.mobileNumber = payload.mobileNumber;
  existing.email = payload.email;
  existing.role = payload.role;
  existing.active = true;
  existing.password = payload.password;
  await existing.save();

  return {identifier: payload.mobileNumber, action: 'updated'};
}

async function seedUsers() {
  await connectDatabase();
  await dropLegacyMobileIndexIfPresent();

  const results = [];
  for (const user of dummyUsers) {
    // Sequential writes keep logs readable for local seeding.
    // eslint-disable-next-line no-await-in-loop
    const result = await upsertUser(user);
    results.push(result);
  }

  console.log('Seed complete:', results);
  process.exit(0);
}

seedUsers().catch(error => {
  console.error('Dummy user seed failed:', error.message);
  process.exit(1);
});
