#!/bin/sh

# Create .env file
echo "NEXT_PUBLIC_USER_NAME=$NEXT_PUBLIC_USER_NAME" > .env
echo "LOGIN_TOKEN=$LOGIN_TOKEN" >> .env

# Optional: Print the .env file for debugging
echo "Generated .env file."
echo "Starting application..."

# Start the application
npx prisma db push
npm run build
npm start