#!/bin/sh

# Auto-generate JWT_SECRET if not set
if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(openssl rand -hex 32)
  echo "Generated JWT_SECRET automatically."
fi

# Create .env file
echo "NEXT_PUBLIC_USER_NAME=$NEXT_PUBLIC_USER_NAME" > .env
echo "JWT_SECRET=$JWT_SECRET" >> .env

echo "Generated .env file."
echo "Starting application..."

# Apply database migrations
npx prisma db push

# Seed admin user if none exists
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
(async () => {
  const count = await prisma.adminUser.count();
  if (count === 0) {
    const hash = await bcrypt.hash('admin', 12);
    await prisma.adminUser.create({ data: { username: 'admin', passwordHash: hash } });
    console.log('Default admin user created (admin/admin)');
  } else {
    console.log('Admin user already exists, skipping seed.');
  }
  await prisma.\$disconnect();
})();
"

# Build and start
npm run build
npm start
