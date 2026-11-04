import express from 'express'
import mongoose from 'mongoose'
import Product from '../Product.js'

const router = express.Router()

const productFields = [
  'name',
  'description',
  'price',
  'category',
  'image',
  'sku',
  'stock',
]

function validateProductInput(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object.' }
  }

  const unexpectedFields = Object.keys(body).filter(
    (field) => !productFields.includes(field),
  )

  if (unexpectedFields.length > 0) {
    return { error: `Unexpected product field: ${unexpectedFields[0]}.` }
  }

  if (partial && Object.keys(body).length === 0) {
    return { error: 'Provide at least one product field to update.' }
  }

  const requiredFields = ['name', 'description', 'price', 'category', 'image']
  if (!partial) {
    const missingField = requiredFields.find(
      (field) => body[field] === undefined,
    )
    if (missingField) {
      return { error: `${missingField} is required.` }
    }
  }

  const product = {}

  for (const field of ['name', 'description', 'category', 'image', 'sku']) {
    if (body[field] === undefined) continue
    if (typeof body[field] !== 'string' || body[field].trim() === '') {
      return { error: `${field} must be a non-empty string.` }
    }
    product[field] = body[field].trim()
  }

  if (body.price !== undefined) {
    if (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price < 0) {
      return { error: 'price must be a non-negative number.' }
    }
    product.price = body.price
  }

  if (body.stock !== undefined) {
    if (!Number.isInteger(body.stock) || body.stock < 0) {
      return { error: 'stock must be a non-negative integer.' }
    }
    product.stock = body.stock
  }

  return { product }
}

function validateProductId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid product ID.' })
  }
  next()
}

router.get('/', async (req, res) => {
  const products = await Product.find()
  res.json(products)
})

router.get('/:id', validateProductId, async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' })
  }
  res.json(product)
})

router.post('/', async (req, res) => {
  const result = validateProductInput(req.body)
  if (result.error) {
    return res.status(400).json({ message: result.error })
  }

  const product = await Product.create(result.product)
  res.status(201).json(product)
})

router.put('/:id', validateProductId, async (req, res) => {
  const result = validateProductInput(req.body, { partial: true })
  if (result.error) {
    return res.status(400).json({ message: result.error })
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: result.product },
    { new: true, runValidators: true },
  )
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' })
  }
  res.json(product)
})

router.delete('/:id', validateProductId, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id)
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' })
  }
  res.status(204).end()
})

router.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error)
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: error.message })
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: 'A product with this data already exists.' })
  }

  console.error('Product API error:', error)
  res.status(500).json({ message: 'Unable to complete the product request.' })
})

export default router
