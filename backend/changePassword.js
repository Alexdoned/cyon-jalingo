import db from './database.js';

const changePassword = async () => {
  try {
    // Wait for database to initialize
    await db.waitForInit();

    // Change this to your desired password
    const newPassword = 'Lanwebanu@#34';

    console.log('Updating admin password...\n');

    const result = await db.updateAdminPassword('admin', newPassword);

    console.log('✅ Password updated successfully!');
    console.log(`Username: admin`);
    console.log(`New password: ${newPassword}\n`);
    console.log('⚠️  Remember to use this new password to login.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

changePassword();
