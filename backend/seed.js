import db from './database.js';

const seedAdmin = async () => {
  try {
    console.log('Checking for existing admin user...');

    // Wait for database tables to be initialized
    if (typeof db.waitForInit === 'function') {
      await db.waitForInit();
    }

    // Check if admin already exists
    const existingAdmin = await db.findAdminByUsername('admin');
    if (existingAdmin) {
      console.log('Admin already exists');
      console.log('Username: admin');
      console.log('Password: Lanwebanu@#34');
      process.exit(0);
    }

    console.log('Creating admin user...');

    // Create admin
    const admin = await db.createAdmin({
      username: 'admin',
      email: 'admin@cyon.com',
      password: 'Lanwebanu@#34',
    });

    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: Lanwebanu@#34');
    console.log('Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedAdmin();
