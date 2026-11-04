import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import PasswordReset from '../models/PasswordReset.js'
import User from '../User.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const OTP_LIFETIME_MS = 5 * 60 * 1000
const RESET_LIFETIME_MS = 10 * 60 * 1000
const SEND_COOLDOWN_MS = 60 * 1000
const SEND_WINDOW_MS = 60 * 60 * 1000
const MAX_SENDS_PER_WINDOW = 5
const MAX_OTP_ATTEMPTS = 5
const COOKIE_NAME = 'illam_session'

function isValidPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    Buffer.byteLength(password, 'utf8') <= 72
  )
}

function getSecret() {
  if (!process.env.JWT_SECRET) {
    throw Object.assign(new Error('Authentication is not configured.'), {
      status: 503,
    })
  }
  return process.env.JWT_SECRET
}

function getUserInfo(user) {
  return { id: user.id, fullName: user.fullName, email: user.email }
}

function cookieOptions(remember = false) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  }
  if (remember) options.maxAge = 7 * 24 * 60 * 60 * 1000
  return options
}

function createSession(res, user, rememberMe) {
  const token = jwt.sign({ sub: user.id }, getSecret(), { expiresIn: '7d' })
  res.cookie(COOKIE_NAME, token, cookieOptions(rememberMe))
}

function hashResetValue(value, userId) {
  return createHmac('sha256', getSecret())
    .update(`${userId}:${value}`)
    .digest('hex')
}

function matchesHash(value, expected) {
  if (typeof expected !== 'string' || !/^[a-f0-9]{64}$/.test(expected)) {
    return false
  }
  const actualHash = Buffer.from(value, 'hex')
  const expectedHash = Buffer.from(expected, 'hex')
  return timingSafeEqual(actualHash, expectedHash)
}

function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw Object.assign(new Error('Email delivery is not configured.'), {
      status: 503,
    })
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

async function register(req, res) {
  const { fullName, email, password, confirmPassword } = req.body || {}
  if (
    typeof fullName !== 'string' ||
    fullName.trim().length < 2 ||
    fullName.trim().length > 120 ||
    typeof email !== 'string' ||
    !emailPattern.test(email.trim()) ||
    email.trim().length > 254 ||
    !isValidPassword(password) ||
    password !== confirmPassword
  ) {
    return res.status(400).json({
      message: 'Provide a name, valid email, matching passwords, and a password of 8 to 72 bytes.',
    })
  }

  const normalizedEmail = email.trim().toLowerCase()
  await User.init()
  if (await User.exists({ email: normalizedEmail })) {
    return res.status(409).json({ message: 'An account with this email already exists.' })
  }

  try {
    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
    })
    res.status(201).json({
      message: 'Account created successfully. You can now log in.',
      user: getUserInfo(user),
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }
    throw error
  }
}

async function login(req, res) {
  const { email, password } = req.body || {}
  if (
    typeof email !== 'string' ||
    !emailPattern.test(email.trim()) ||
    typeof password !== 'string' ||
    !password
  ) {
    return res.status(400).json({ message: 'A valid email and password are required.' })
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() })
    .select('+password')
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Email or password is incorrect.' })
  }

  createSession(res, user, req.body?.rememberMe === true)
  res.json({ user: getUserInfo(user) })
}

async function logout(_req, res) {
  res.clearCookie(COOKIE_NAME, cookieOptions())
  res.json({ message: 'Signed out.' })
}

async function getCurrentUser(req, res) {
  const user = await User.findById(req.userId)
  if (!user) {
    res.clearCookie(COOKIE_NAME, cookieOptions())
    return res.status(401).json({ message: 'Your session is no longer valid.' })
  }
  res.json({ user: getUserInfo(user) })
}

async function forgotPassword(req, res) {
  const email = typeof req.body?.email === 'string'
    ? req.body.email.trim().toLowerCase()
    : ''
  if (!emailPattern.test(email) || email.length > 254) {
    return res.status(400).json({ message: 'Enter a valid email address.' })
  }
  if (!process.env.JWT_SECRET || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return res.status(503).json({
      message: 'Password recovery is temporarily unavailable. Please try again later.',
    })
  }

  const genericResponse = {
    message: 'If an account exists for that email, a verification code will be sent.',
  }
  const user = await User.findOne({ email })
  if (!user) return res.status(202).json(genericResponse)

  const now = new Date()
  let reset = await PasswordReset.findOne({ user: user._id })
  if (!reset) {
    try {
      reset = await PasswordReset.create({
        user: user._id,
        otpHash: 'pending',
        otpExpiresAt: now,
        deleteAt: new Date(now.getTime() + SEND_WINDOW_MS),
        sentAt: new Date(0),
        windowStartedAt: now,
        sendCount: 0,
      })
    } catch (error) {
      if (error.code !== 11000) throw error
      reset = await PasswordReset.findOne({ user: user._id })
    }
  }

  if (reset.sentAt.getTime() > now.getTime() - SEND_COOLDOWN_MS) {
    return res.status(202).json(genericResponse)
  }

  if (reset.windowStartedAt.getTime() <= now.getTime() - SEND_WINDOW_MS) {
    reset.windowStartedAt = now
    reset.sendCount = 0
  }
  if (reset.sendCount >= MAX_SENDS_PER_WINDOW) {
    return res.status(202).json(genericResponse)
  }

  const otp = String(randomInt(100000, 1000000))
  reset.otpHash = hashResetValue(otp, user.id)
  reset.otpExpiresAt = new Date(now.getTime() + OTP_LIFETIME_MS)
  reset.deleteAt = new Date(now.getTime() + SEND_WINDOW_MS)
  reset.attempts = 0
  reset.sentAt = now
  reset.sendCount += 1
  reset.verifiedAt = null
  reset.resetTokenHash = null
  reset.resetExpiresAt = null
  try {
    await reset.save()
  } catch (error) {
    if (error.name === 'VersionError') return res.status(202).json(genericResponse)
    throw error
  }

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Your Illam password reset code',
      text: `Your Illam verification code is ${otp}. It expires in 5 minutes. If you did not request this, you can ignore this email.`,
    })
  } catch (error) {
    console.error('Password reset email delivery failed:', error.message)
  }
  res.status(202).json(genericResponse)
}

async function verifyOtp(req, res) {
  const email = typeof req.body?.email === 'string'
    ? req.body.email.trim().toLowerCase()
    : ''
  const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : ''
  if (!emailPattern.test(email) || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ message: 'The verification code is invalid or expired.' })
  }
  if (!process.env.JWT_SECRET) {
    return res.status(503).json({ message: 'Password recovery is temporarily unavailable.' })
  }

  const user = await User.findOne({ email })
  if (!user) {
    return res.status(400).json({ message: 'The verification code is invalid or expired.' })
  }
  const reset = await PasswordReset.findOne({ user: user._id })
  if (
    !reset ||
    reset.otpExpiresAt <= new Date() ||
    reset.attempts >= MAX_OTP_ATTEMPTS ||
    reset.verifiedAt ||
    !matchesHash(hashResetValue(otp, user.id), reset.otpHash)
  ) {
    if (reset && reset.attempts < MAX_OTP_ATTEMPTS && !reset.verifiedAt) {
      await PasswordReset.updateOne(
        { _id: reset._id, attempts: reset.attempts },
        { $inc: { attempts: 1 } },
      )
    }
    return res.status(400).json({ message: 'The verification code is invalid or expired.' })
  }

  const resetToken = randomBytes(32).toString('base64url')
  const now = new Date()
  reset.verifiedAt = now
  reset.resetTokenHash = hashResetValue(resetToken, user.id)
  reset.resetExpiresAt = new Date(now.getTime() + RESET_LIFETIME_MS)
  reset.deleteAt = reset.resetExpiresAt
  await reset.save()
  res.json({ resetToken })
}

async function resetPassword(req, res) {
  const { email, resetToken, newPassword, confirmPassword } = req.body || {}
  if (
    typeof email !== 'string' ||
    !emailPattern.test(email.trim()) ||
    typeof resetToken !== 'string' ||
    !isValidPassword(newPassword) ||
    newPassword !== confirmPassword
  ) {
    return res.status(400).json({
      message: 'Provide a valid email, matching passwords, and a password of 8 to 72 bytes.',
    })
  }
  if (!process.env.JWT_SECRET) {
    return res.status(503).json({ message: 'Password recovery is temporarily unavailable.' })
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() })
  const reset = user ? await PasswordReset.findOne({ user: user._id }) : null
  if (
    !user ||
    !reset ||
    !reset.verifiedAt ||
    !reset.resetExpiresAt ||
    reset.resetExpiresAt <= new Date() ||
    !matchesHash(hashResetValue(resetToken, user.id), reset.resetTokenHash)
  ) {
    return res.status(401).json({ message: 'Password reset authorization is invalid or expired.' })
  }

  const now = new Date()
  const consumedReset = await PasswordReset.findOneAndUpdate(
    {
      _id: reset._id,
      resetTokenHash: reset.resetTokenHash,
      resetExpiresAt: { $gt: now },
    },
    { $set: { resetTokenHash: null, verifiedAt: null } },
    { returnDocument: 'after' },
  )
  if (!consumedReset) {
    return res.status(401).json({ message: 'Password reset authorization is invalid or expired.' })
  }

  user.password = await bcrypt.hash(newPassword, 12)
  await user.save()
  await PasswordReset.deleteOne({ _id: reset._id })
  res.json({ message: 'Password reset successfully.' })
}

export {
  forgotPassword,
  getCurrentUser,
  login,
  logout,
  register,
  resetPassword,
  verifyOtp,
}
