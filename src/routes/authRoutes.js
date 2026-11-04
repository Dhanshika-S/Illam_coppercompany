import express from 'express'
import rateLimit from 'express-rate-limit'
import requireAuth from '../middleware/requireAuth.js'
import {
  forgotPassword,
  getCurrentUser,
  login,
  logout,
  register,
  resetPassword,
  verifyOtp,
} from '../controllers/authController.js'

const router = express.Router()
const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many verification requests. Please try again later.' },
})
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
})

router.post('/register', register)
router.post('/login', loginRateLimit, login)
router.post('/logout', logout)
router.get('/me', requireAuth, getCurrentUser)
router.post('/forgot-password', otpRateLimit, forgotPassword)
router.post('/verify-otp', otpRateLimit, verifyOtp)
router.post('/reset-password', otpRateLimit, resetPassword)

export default router
