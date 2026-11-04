import express from 'express'
import mongoose from 'mongoose'
import Cart from '../Cart.js'
import Product from '../Product.js'
import requireAuth from '../middleware/requireAuth.js'

const router = express.Router()
router.use(requireAuth)

function validateProductId(value) {
  return mongoose.isValidObjectId(value)
}

async function getPopulatedCart(userId) {
  const cart = await Cart.findOne({ user: userId }).populate(
    'items.product',
    'sku name description price category image stock',
  )

  if (!cart) {
    return {
      items: [],
      itemCount: 0,
      productCount: 0,
      subtotal: 0,
      deliveryCharge: 0,
      total: 0,
    }
  }

  const items = cart.items
    .filter((item) => item.product)
    .map((item) => ({
      product: item.product,
      quantity: item.quantity,
      addedAt: item.addedAt,
      subtotal: item.product.price * item.quantity,
    }))

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    productCount: items.length,
    subtotal,
    deliveryCharge: 0,
    total: subtotal,
  }
}

router.get('/', async (req, res) => {
  const cart = await getPopulatedCart(req.userId)
  res.json(cart)
})

router.post('/add', async (req, res) => {
  const { productId, quantity = 1 } = req.body || {}
  if (!validateProductId(productId)) {
    return res.status(400).json({ message: 'A valid product ID is required.' })
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ message: 'Quantity must be a positive integer.' })
  }

  const product = await Product.findById(productId)
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' })
  }

  let cart = await Cart.findOne({ user: req.userId })
  if (!cart) {
    cart = new Cart({ user: req.userId, items: [] })
  }

  const item = cart.items.find((entry) => entry.product.equals(product._id))
  const nextQuantity = (item?.quantity || 0) + quantity
  if (nextQuantity > product.stock) {
    return res.status(409).json({ message: 'Requested quantity exceeds available stock.' })
  }

  if (item) {
    item.quantity = nextQuantity
  } else {
    cart.items.push({ product: product._id, quantity, addedAt: new Date() })
  }
  await cart.save()

  res.status(200).json(await getPopulatedCart(req.userId))
})

router.put('/items/:productId', async (req, res) => {
  const { productId } = req.params
  const { quantity } = req.body || {}
  if (!validateProductId(productId)) {
    return res.status(400).json({ message: 'Invalid product ID.' })
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ message: 'Quantity must be at least 1.' })
  }

  const [cart, product] = await Promise.all([
    Cart.findOne({ user: req.userId }),
    Product.findById(productId),
  ])
  if (!cart || !cart.items.some((item) => item.product.equals(productId))) {
    return res.status(404).json({ message: 'Cart item not found.' })
  }
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' })
  }
  if (quantity > product.stock) {
    return res.status(409).json({ message: 'Requested quantity exceeds available stock.' })
  }

  cart.items.find((item) => item.product.equals(productId)).quantity = quantity
  await cart.save()
  res.json(await getPopulatedCart(req.userId))
})

router.delete('/items/:productId', async (req, res) => {
  const { productId } = req.params
  if (!validateProductId(productId)) {
    return res.status(400).json({ message: 'Invalid product ID.' })
  }

  const cart = await Cart.findOne({ user: req.userId })
  if (!cart) {
    return res.status(404).json({ message: 'Cart item not found.' })
  }

  const originalCount = cart.items.length
  cart.items = cart.items.filter((item) => !item.product.equals(productId))
  if (cart.items.length === originalCount) {
    return res.status(404).json({ message: 'Cart item not found.' })
  }

  await cart.save()
  res.json(await getPopulatedCart(req.userId))
})

router.put('/order', async (req, res) => {
  const { productIds } = req.body || {}
  if (!Array.isArray(productIds) || productIds.some((id) => !validateProductId(id))) {
    return res.status(400).json({ message: 'Provide an ordered list of valid product IDs.' })
  }

  const cart = await Cart.findOne({ user: req.userId })
  if (!cart || productIds.length !== cart.items.length) {
    return res.status(400).json({ message: 'Order must include every cart item exactly once.' })
  }
  const uniqueIds = new Set(productIds.map(String))
  if (uniqueIds.size !== cart.items.length ||
    cart.items.some((item) => !uniqueIds.has(item.product.toString()))) {
    return res.status(400).json({ message: 'Order must include every cart item exactly once.' })
  }

  const indexById = new Map(productIds.map((id, index) => [String(id), index]))
  cart.items.sort(
    (left, right) =>
      indexById.get(left.product.toString()) - indexById.get(right.product.toString()),
  )
  await cart.save()
  res.json(await getPopulatedCart(req.userId))
})

router.delete('/clear', async (req, res) => {
  await Cart.findOneAndUpdate(
    { user: req.userId },
    { $set: { items: [] } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  )
  res.json(await getPopulatedCart(req.userId))
})

export default router
