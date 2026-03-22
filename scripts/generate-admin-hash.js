// Run once: node scripts/generate-admin-hash.js
// Then set ADMIN_PASSWORD_HASH in Vercel (and .env.local) to the printed value.
const bcrypt = require('bcryptjs');
const password = 'Welcome2REDI*';
const hash = bcrypt.hashSync(password, 10);
console.log('Set this in Vercel Environment Variables:');
console.log('ADMIN_PASSWORD_HASH=' + hash);
console.log('\nAlso set JWT_SECRET (e.g. run: openssl rand -hex 32)');
console.log('And BLOB_READ_WRITE_TOKEN from Vercel → Storage → Blob.');
