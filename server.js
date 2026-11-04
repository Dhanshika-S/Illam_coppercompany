import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import authRoutes from './src/routes/authRoutes.js'
import cartRoutes from './src/routes/cartRoutes.js'
import orderRoutes from './src/routes/orderRoutes.js'
import productRoutes from './src/routes/productRoutes.js'

dotenv.config()

const app = express()

const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173'
app.use(cors({ origin: clientOrigin, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/', (req, res) => {
  res.send('Illam Backend Server is Running!')
})

app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'database-unavailable',
  })
})

app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'MongoDB is unavailable. Check the Atlas cluster and network access.',
    })
  }
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)

app.use((error, req, res, _next) => {
  console.error('API request failed:', error.message)
  if (error.status) {
    return res.status(error.status).json({ message: error.message })
  }
  if (error.code === 11000) {
    return res.status(409).json({ message: 'A record with these details already exists.' })
  }
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: 'The submitted data is invalid.' })
  }
  res.status(500).json({ message: 'An unexpected server error occurred.' })
})

const PORT = process.env.PORT || 5000
const SERVER_SELECTION_TIMEOUT_MS = 8000

if (!process.env.MONGO_URI) {
  console.error('MongoDB Connection Error: MONGO_URI is not configured.')
  process.exitCode = 1
} else {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })

  async function connectToMongoDB() {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      })
      console.log('MongoDB Connected Successfully')
    } catch (error) {
      const causes = new Set()
      for (const server of error.reason?.servers?.values?.() || []) {
        const code = server.error?.cause?.code || server.error?.code
        if (code) causes.add(code)
      }

      console.error(
        'MongoDB Connection Error:',
        error.name,
        causes.size ? `(${[...causes].join(', ')})` : '',
      )
      setTimeout(connectToMongoDB, 10000).unref()
    }
  }

  connectToMongoDB()
}