import mongoose from 'mongoose'

const passwordResetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    deleteAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    sentAt: { type: Date, required: true },
    windowStartedAt: { type: Date, required: true },
    sendCount: { type: Number, default: 1 },
    verifiedAt: { type: Date, default: null },
    resetTokenHash: { type: String, default: null },
    resetExpiresAt: { type: Date, default: null },
  },
  { timestamps: true, optimisticConcurrency: true },
)

passwordResetSchema.index({ deleteAt: 1 }, { expireAfterSeconds: 0 })

const PasswordReset =
  mongoose.models.PasswordReset ||
  mongoose.model('PasswordReset', passwordResetSchema)

export default PasswordReset
