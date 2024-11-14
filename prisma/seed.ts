import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const seedData = [
  {
    title: 'Macbook Pro',
    description: 'A new Macbook Pro!',
    url: 'https://www.apple.com/us-edu/shop/buy-mac/macbook-pro',
    image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/macbook-pro-og-202410?wid=1200&hei=630&fmt=jpeg&qlt=95&.v=1728658184478',
    currency: 'USD',
    price: 1990.0,
    priority: 1,
    createdAt: new Date(1731613321638),
    updatedAt: new Date(1731613321638)
  },
  {
    title: 'Unifi Dream Machine',
    description: '10G Cloud Gateway with 200+ UniFi device / 2,000+ client support, 5 Gbps IPS routing, and redundant NVR storage.',
    url: 'https://eu.store.ui.com/eu/en/category/all-unifi-cloud-gateways/products/udm-pro-max',
    image: 'https://cdn.ecomm.ui.com/products/401190d7-6a49-4c2e-bef1-7fe087d2b6b6/4b982f0e-b292-4724-a388-cc7a18b36448.png',
    currency: 'USD',
    price: 550.0,
    priority: 2,
    createdAt: new Date(1731613396080),
    updatedAt: new Date(1731613396080)
  },
  {
    title: 'Server Rack Cabinet - 42U 36in Deep',
    description: '42U Server Rack Cabinet - 36 in. Deep Enclosure - Mount your server or networking equipment in this 42U server cabinet | France (en)',
    url: 'https://www.startech.com/en-fr/server-management/rk4236bkb?srsltid=AfmBOorzYH2uSB_4RU-ko21cmAKKcmVhwN5xwpOa7Ws_OQOAYnw9s0TU',
    image: 'https://media.startech.com/cms/products/thumb/rk4236bkb.main.jpg',
    currency: 'EUR',
    price: 721.0,
    priority: 3,
    createdAt: new Date(1731613436809),
    updatedAt: new Date(1731613436809)
  },
  {
    title: 'PS5 Controller',
    description: 'I link this pink one',
    url: 'https://www.tradergames.fr/fr/playstation-5/244973-controller-dualsense-nova-pink-sony-ps5-euro-new-0711719575962.html',
    image: 'https://www.tradergames.fr/538603-large_default/controller-dualsense-nova-pink-sony-ps5-euro-new.jpg',
    currency: 'EUR',
    price: 79.99,
    priority: 2,
    purchased: true,
    purchasedAt: new Date(1731613502504),
    purchasedBy: 'Mommy',
    createdAt: new Date(1731613494450),
    updatedAt: new Date(1731613502526)
  }
]

async function main() {
  console.log('Seeding database...')
  
  // Clear existing data
  await prisma.wishlistItem.deleteMany()
  
  // Insert seed data
  for (const item of seedData) {
    await prisma.wishlistItem.create({
      data: item
    })
  }
  
  console.log('Database has been seeded')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })