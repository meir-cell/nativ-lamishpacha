import mysql from 'mysql2/promise';

const host = 'altaria.proxy.rlwy.net';
const port = 35506;
const password = 'Meir@054';

// Try different username combinations
const users = [
  'ynr@college.org',
  'root',
  'mysql',
  'admin',
  'railway',
];

for (const user of users) {
  try {
    const conn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      connectTimeout: 5000,
    });
    const [rows] = await conn.query('SHOW DATABASES');
    console.log('✅ Connected as:', user);
    console.log('Databases:', rows.map(r => Object.values(r)[0]).join(', '));
    await conn.end();
    break;
  } catch (e) {
    console.log('❌', user, '->', e.message.substring(0, 80));
  }
}
