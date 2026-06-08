import db from './database.js';

const seedDiocesan = async () => {
  try {
    // Wait for database tables to initialize
    await db.waitForInit();

    console.log('Setting up diocesan payment account...\n');

    // Single diocesan account for all payments
    const diocesanData = {
      denary: 'jalingo',
      dioceseName: 'Jalingo Diocese',
      accountHolderName: 'Catholic Youth Org of Nig. Jalingo.',
      accountNumber: '1013883316',
      bankName: 'Zenith bank',
      sortCode: '057150',
      routingNumber: '003',
      currency: 'USD'
    };

    try {
      const existing = await db.getDiocesan('jalingo');
      if (existing) {
        console.log('✅ Jalingo Diocese account already exists, updating...\n');
        await db.updateDiocesan('jalingo', diocesanData);
        console.log('✅ Updated: Jalingo Diocese account');
        console.log(`Account Details:`);
        console.log(`  Diocese: ${diocesanData.dioceseName}`);
        console.log(`  Account: ${diocesanData.accountNumber}`);
        console.log(`  Bank: ${diocesanData.bankName}`);
        console.log(`  SORT CODE: ${diocesanData.sortCode}\n`);
        console.log('✅ Update complete! This account will be used for all registrations.');
        process.exit(0);
      }

      await db.createDiocesan(diocesanData);
      console.log(`✅ Created: ${diocesanData.dioceseName}`);
      console.log(`   Account: ${diocesanData.accountNumber}`);
      console.log(`   Bank: ${diocesanData.bankName}`);
      console.log(`   SORT CODE: ${diocesanData.sortCode}\n`);
      console.log('✅ Setup complete! This account will be used for all registrations.');

      process.exit(0);
    } catch (error) {
      console.error(`❌ Error:`, error.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDiocesan();
