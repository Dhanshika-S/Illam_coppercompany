import { useEffect, useState } from 'react'
import { SiteBrand } from '../components/SiteLayout.jsx'
import { apiRequest } from '../utils/api.js'
import { clearDemoUser, saveDemoUser } from '../utils/demoAuth.js'
import './login.css'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function LoginPage() {
  const [view, setView] = useState('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  useEffect(() => {
    apiRequest('/auth/me')
      .then((session) => {
        saveDemoUser(session)
        window.location.replace('/')
      })
      .catch(() => {
        clearDemoUser()
      })
  }, [])

  function showFeedback(type, message) {
    setFeedback({ type, message })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFeedback({ type: '', message: '' })

    if (!emailPattern.test(email.trim())) {
      showFeedback('error', 'Please enter a valid email address.')
      return
    }

    if (view === 'verify') {
      if (!/^\d{6}$/.test(otp)) {
        showFeedback('error', 'Enter the six-digit verification code.')
        return
      }
    } else if (view === 'reset' || view === 'register') {
      if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
        showFeedback('error', 'Your password must be between 8 and 72 bytes.')
        return
      }
      if (password !== confirmPassword) {
        showFeedback('error', 'The passwords do not match.')
        return
      }
    } else if (view === 'login' && !password) {
      showFeedback('error', 'Please enter your password.')
      return
    }

    if (view === 'register' && fullName.trim().length < 2) {
      showFeedback('error', 'Please enter your full name.')
      return
    }

    setBusy(true)
    try {
      if (view === 'register') {
        await apiRequest('/auth/register', {
          method: 'POST',
          body: {
            fullName: fullName.trim(),
            email: email.trim(),
            password,
            confirmPassword,
          },
        })
        setView('login')
        setPassword('')
        setConfirmPassword('')
        showFeedback('success', 'Account created successfully. Please log in.')
        return
      }

      if (view === 'login') {
        const session = await apiRequest('/auth/login', {
          method: 'POST',
          body: { email: email.trim(), password, rememberMe },
        })
        saveDemoUser(session)
        window.location.assign('/')
        return
      }

      if (view === 'forgot') {
        const result = await apiRequest('/auth/forgot-password', {
          method: 'POST',
          body: { email: email.trim() },
        })
        setView('verify')
        setOtp('')
        showFeedback('success', result.message)
        return
      }

      if (view === 'verify') {
        const result = await apiRequest('/auth/verify-otp', {
          method: 'POST',
          body: { email: email.trim(), otp },
        })
        setResetToken(result.resetToken)
        setPassword('')
        setConfirmPassword('')
        setView('reset')
        return
      }

      if (view === 'reset') {
        await apiRequest('/auth/reset-password', {
          method: 'POST',
          body: {
            email: email.trim(),
            resetToken,
            newPassword: password,
            confirmPassword,
          },
        })
        setView('login')
        setPassword('')
        setConfirmPassword('')
        setResetToken('')
        showFeedback('success', 'Password reset successfully. You can now log in.')
        window.setTimeout(() => setFeedback({ type: '', message: '' }), 5000)
      }
    } catch (error) {
      showFeedback('error', error.message)
    } finally {
      setBusy(false)
    }
  }

  function changeView(nextView) {
    setView(nextView)
    setFeedback({ type: '', message: '' })
    setPassword('')
    setConfirmPassword('')
    if (nextView === 'forgot') setOtp('')
  }

  const isRegistering = view === 'register'
  const isResetting = view === 'reset'
  const asksForPassword = view === 'login' || isRegistering || isResetting
  const title = {
    login: 'Login to Illam',
    register: 'Create your account',
    forgot: 'Forgot your password?',
    verify: 'Verify your email',
    reset: 'Reset your password',
  }[view]

  return (
    <div className="login-page">
      <div className="login-brand">
        <SiteBrand />
      </div>
      <main className="login-main">
        <section className="login-card">
          <p className="login-eyebrow">WELCOME BACK</p>
          <h1>{title}</h1>
          <p className="login-intro">
            {view === 'verify'
              ? `Enter the six-digit code sent to ${email}.`
              : view === 'forgot'
                ? 'Enter your email address and we will send a verification code if an account exists.'
                : view === 'reset'
                  ? 'Choose a new password for your Illam account.'
                  : 'Sign in to continue exploring traditional living.'}
          </p>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {isRegistering && (
              <>
                <label htmlFor="login-full-name">Full name</label>
                <input
                  id="login-full-name"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your full name"
                  maxLength={120}
                  required
                />
              </>
            )}

            {view !== 'verify' && (
              <>
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setFeedback({ type: '', message: '' })
                  }}
                  placeholder="you@example.com"
                  required
                  readOnly={isResetting}
                />
              </>
            )}

            {view === 'verify' && (
              <>
                <label htmlFor="login-otp">Verification code</label>
                <input
                  id="login-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(event) => {
                    setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                    setFeedback({ type: '', message: '' })
                  }}
                  placeholder="6-digit code"
                  maxLength={6}
                  required
                />
              </>
            )}

            {asksForPassword && (
              <>
                <label htmlFor="login-password">
                  {isResetting ? 'New password' : 'Password'}
                </label>
                <div className="login-password-field">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isRegistering || isResetting ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      setFeedback({ type: '', message: '' })
                    }}
                    placeholder={isResetting ? 'Enter a new password' : 'Enter your password'}
                    minLength={isRegistering || isResetting ? 8 : undefined}
                    required
                  />
                  <button
                    className="login-password-toggle"
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((isVisible) => !isVisible)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </>
            )}

            {(isRegistering || isResetting) && (
              <>
                <label htmlFor="login-confirm-password">
                  {isResetting ? 'Confirm new password' : 'Confirm password'}
                </label>
                <input
                  id="login-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value)
                    setFeedback({ type: '', message: '' })
                  }}
                  placeholder="Re-enter your password"
                  minLength={8}
                  required
                />
              </>
            )}

            {view === 'login' && (
              <div className="login-options">
                <label className="login-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <button
                  className="login-mode-toggle"
                  type="button"
                  onClick={() => changeView('forgot')}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {feedback.message && (
              <p
                className={`login-feedback ${feedback.type}`}
                role={feedback.type === 'error' ? 'alert' : 'status'}
              >
                {feedback.message}
              </p>
            )}

            <button className="login-submit" type="submit" disabled={busy}>
              {busy
                ? 'Please wait...'
                : isRegistering
                  ? 'Create Account'
                  : view === 'login'
                    ? 'Login'
                    : view === 'forgot'
                      ? 'Send OTP'
                      : view === 'verify'
                        ? 'Verify OTP'
                        : 'Reset Password'}
            </button>
          </form>

          {view === 'verify' && (
            <p className="login-register">
              Didn&apos;t receive a code?{' '}
              <button
                className="login-mode-toggle"
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  setFeedback({ type: '', message: '' })
                  try {
                    const result = await apiRequest('/auth/forgot-password', {
                      method: 'POST',
                      body: { email: email.trim() },
                    })
                    showFeedback('success', result.message)
                  } catch (error) {
                    showFeedback('error', error.message)
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                Resend OTP
              </button>
            </p>
          )}

          <p className="login-register">
            {view === 'login' && (
              <>
                New to Illam?{' '}
                <button className="login-mode-toggle" type="button" onClick={() => changeView('register')}>
                  Create an account
                </button>
              </>
            )}
            {view === 'register' && (
              <>
                Already have an account?{' '}
                <button className="login-mode-toggle" type="button" onClick={() => changeView('login')}>
                  Login
                </button>
              </>
            )}
            {['forgot', 'verify', 'reset'].includes(view) && (
              <button className="login-mode-toggle" type="button" onClick={() => changeView('login')}>
                Back to Login
              </button>
            )}
          </p>
        </section>
      </main>
    </div>
  )
}

export default LoginPage
