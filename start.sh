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

# Apply database schema. First-time setup of the admin account is handled
# in-app at /setup (the page is shown automatically while no admin exists).
npx prisma db push --accept-data-loss

# Build and start
npm run build
npm start
