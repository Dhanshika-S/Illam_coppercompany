import dotenv from 'dotenv'
import mongoose from 'mongoose'
import Product from '../src/Product.js'

dotenv.config()

const catalogue = [
  {
    sku: 'ILL-KIT-0001',
    name: 'Traditional Cooking Kadai',
    description: 'A traditional lidded kadai for preparing and serving everyday meals.',
    price: 1499,
    category: 'Kitchen & Dining',
    image: 'kadai.png',
  },
  {
    sku: 'ILL-KIT-0002',
    name: 'Traditional Kitchen Essential',
    description: 'A reusable bottle with a matching cup for daily use at home or on the go.',
    price: 899,
    category: 'Kitchen & Dining',
    image: 'kitchen.png',
  },
  {
    sku: 'ILL-KIT-0003',
    name: 'Traditional Coffee Set',
    description: 'A classic vessel set to bring a familiar touch to coffee and tea serving.',
    price: 1099,
    category: 'Kitchen & Dining',
    image: 'coffee.png',
  },
  {
    sku: 'ILL-BRP-0004',
    name: 'Standing Pooja Bell',
    description: 'A decorative standing bell with an ornate figure, suited to a pooja space.',
    price: 2499,
    category: 'Brass & Pooja',
    image: 'product4.png',
  },
  {
    sku: 'ILL-BRP-0005',
    name: 'Ornate Pooja Pot',
    description: 'A richly detailed vessel that adds a traditional accent to a pooja setting.',
    price: 1999,
    category: 'Brass & Pooja',
    image: 'product5.png',
  },
  {
    sku: 'ILL-BRP-0006',
    name: 'Pooja Thali Set',
    description: 'A coordinated collection of pooja vessels and accessories arranged on a tray.',
    price: 2299,
    category: 'Brass & Pooja',
    image: 'product6.png',
  },
  {
    sku: 'ILL-DEC-0007',
    name: 'Decorative Peacock Urli',
    description: 'A peacock-shaped bowl displayed with flowers as a decorative centrepiece.',
    price: 1799,
    category: 'Home Décor',
    image: 'product7.png',
  },
  {
    sku: 'ILL-DEC-0008',
    name: 'Tabletop Basket and Jar Set',
    description: 'A coordinated tabletop arrangement with a handled basket and lidded jar.',
    price: 1599,
    category: 'Home Décor',
    image: 'product8.png',
  },
  {
    sku: 'ILL-DEC-0009',
    name: 'Twin Peacock Diya Holders',
    description: 'A pair of peacock-shaped holders with small lamp bowls for a traditional display.',
    price: 2699,
    category: 'Home Décor',
    image: 'product9.png',
  },
]

if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI is not configured.')
}

try {
  await mongoose.connect(process.env.MONGO_URI)
  await Product.init()

  const operations = catalogue.map((product) => ({
    updateOne: {
      filter: { sku: product.sku },
      update: {
        $set: product,
        $setOnInsert: { stock: 10 },
      },
      upsert: true,
    },
  }))
  const result = await Product.bulkWrite(operations, { ordered: true })

  console.log(
    `Catalog sync complete: ${result.upsertedCount} added, ${result.modifiedCount} updated.`,
  )
  console.log('Existing matching product stock and unrelated fields were preserved.')
} finally {
  await mongoose.disconnect()
}
