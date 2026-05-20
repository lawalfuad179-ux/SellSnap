const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  try {
    console.log('Testing bcrypt...');
    const hash = await bcrypt.hash('password123', 10);
    console.log('Bcrypt OK. Hash:', hash);
  } catch (e) {
    console.error('Bcrypt Error:', e);
  }

  try {
    console.log('Testing Prisma...');
    const prisma = new PrismaClient();
    const user = await prisma.user.findFirst();
    console.log('Prisma OK. Users count:', user ? 1 : 0);
  } catch (e) {
    console.error('Prisma Error:', e);
  }
}

main();
