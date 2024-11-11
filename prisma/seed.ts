import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
  // Create admin user with SHA256 hashed password
  const hashedPassword = crypto
    .createHash('sha256')
    .update('admin')
    .digest('hex')

  // await prisma.user.upsert({
  //   where: { username: 'admin' },
  //   update: {},
  //   create: {
  //     username: 'admin',
  //     password: hashedPassword,
  //     isAdmin: true,
  //   },
  // })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })