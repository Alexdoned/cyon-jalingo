import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./cyon.db');
db.all('PRAGMA table_info(diocesan_accounts)', (err, rows) => {
  if (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
