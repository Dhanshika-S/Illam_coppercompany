import { randomBytes } from 'node:crypto'
import express from 'express'
import mongoose from 'mongoose'
import Cart from '../Cart.js'
import Order from '../Order.js'
import Product from '../Product.js'
import requireAuth from '../middleware/requireAuth.js'

const router = express.Router()
router.use(requireAuth)

const requiredCustomerFields = [
  'fullName',
  'email',
  'phone',
  'address',
  'city',
  'state',
  'pinCode',
]

function validateCustomer(customer) {
  if (!customer || typeof customer !== 'object' || Array.isArray(customer)) {
    return 'Customer and delivery details are required.'
  }

  for (const field of requiredCustomerFields) {
    if (typeof customer[field] !== 'string' || customer[field].trim() === '') {
      return `${field} is required.`
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
    return 'A valid email address is required.'
  }
  const phoneDigits = customer.phone.replace(/\D/g, '')
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    return 'A valid mobile number is required.'
  }
  if (!/^\d{6}$/.test(customer.pinCode.trim())) {
    return 'PIN code must contain exactly 6 digits.'
  }
  return null
}

router.post('/', async (req, res) => {
  const validationError = validateCustomer(req.body?.customer)
  if (validationError) {
    return res.status(400).json({ message: validationError })
  }

  const idempotencyKey = req.get('Idempotency-Key')
  if (!idempotencyKey || idempotencyKey.length > 100) {
    return res.status(400).json({ message: 'A valid Idempotency-Key header is required.' })
  }

  const previousOrder = await Order.findOne({
    user: req.userId,
    idempotencyKey,
  })
  if (previousOrder) {
    return res.status(200).json(previousOrder)
  }

  const session = await mongoose.startSession()
  let createdOrder

  try {
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ user: req.userId }).session(session)
      if (!cart || cart.items.length === 0) {
        const error = new Error('Your cart is empty.')
        error.status = 400
        throw error
      }

      const orderItems = []
      let subtotal = 0

      for (const cartItem of cart.items) {
        const product = await Product.findById(cartItem.product).session(session)
        if (!product || product.stock < cartItem.quantity) {
          const error = new Error(
            `${product?.name || 'A cart product'} is no longer available in the requested quantity.`,
          )
          error.status = 409
          throw error
        }

        const stockUpdate = await Product.updateOne(
          { _id: product._id, stock: { $gte: cartItem.quantity } },
          { $inc: { stock: -cartItem.quantity } },
          { session },
        )
        if (stockUpdate.modifiedCount !== 1) {
          const error = new Error(`${product.name} no longer has sufficient stock.`)
          error.status = 409
          throw error
        }

        const itemSubtotal = product.price * cartItem.quantity
        subtotal += itemSubtotal
        orderItems.push({
          product: product._id,
          name: product.name,
          image: product.image,
          quantity: cartItem.quantity,
          unitPrice: product.price,
          subtotal: itemSubtotal,
        })
      }

      const now = new Date()
      const datePart = now.toISOString().slice(0, 10).replaceAll('-', '')
      const idSuffix = randomBytes(4).toString('hex').toUpperCase()
      const orderId = `ILL-${datePart}-${idSuffix}`
      const invoiceNumber = `INV-${datePart}-${idSuffix}`
      const shippingCharge = 0
      const tax = 0

      const [order] = await Order.create(
        [
          {
            orderId,
            invoiceNumber,
            idempotencyKey,
            user: req.userId,
            items: orderItems,
            customer: Object.fromEntries(
              requiredCustomerFields.map((field) => [
                field,
                req.body.customer[field].trim(),
              ]),
            ),
            subtotal,
            shippingCharge,
            tax,
            total: subtotal + shippingCharge + tax,
            status: 'Placed',
          },
        ],
        { session },
      )

      await Cart.updateOne(
        { user: req.userId },
        { $set: { items: [] } },
        { session },
      )
      createdOrder = order
    })
  } catch (error) {
    if (error.code === 11000) {
      const duplicateOrder = await Order.findOne({
        user: req.userId,
        idempotencyKey,
      })
      if (duplicateOrder) {
        return res.status(200).json(duplicateOrder)
      }
    }

    if (error.status) {
      return res.status(error.status).json({ message: error.message })
    }
    throw error
  } finally {
    await session.endSession()
  }

  res.status(201).json(createdOrder)
})

router.get('/my-orders', async (req, res) => {
  const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 })
  res.json(orders)
})

router.get('/:orderId', async (req, res) => {
  const order = await Order.findOne({
    orderId: req.params.orderId,
    user: req.userId,
  })
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' })
  }
  res.json(order)
})

export default router
