import { useCallback, useEffect, useRef, useState } from 'react'
import { clearDemoUser, getDemoUser } from '../utils/demoAuth.js'
import { apiRequest } from '../utils/api.js'
import './SiteLayout.css'

const navigationLinks = [
  { label: 'Home', href: '/' },
  { label: 'Collections', href: '/products.html' },
  { label: 'Our Story', href: '/#our-story' },
]

function SiteBrand() {
  return (
    <a className="site-brand" href="/" aria-label="Illam home">
      <span className="site-brand-name">இல்லம்</span>
      <span className="site-brand-tagline">TRADITIONAL LIVING</span>
    </a>
  )
}

function SiteHeader({ showShopButton = false }) {
  const [demoUser, setDemoUser] = useState(getDemoUser)
  const [currentCartCount, setCurrentCartCount] = useState(0)
  const cartCountRequest = useRef(0)
  const refreshCartCount = useCallback(async () => {
    const requestId = ++cartCountRequest.current
    if (!getDemoUser()) {
      setCurrentCartCount(0)
      return
    }

    try {
      const cart = await apiRequest('/cart')
      if (requestId === cartCountRequest.current) {
        setCurrentCartCount(cart.itemCount)
      }
    } catch (error) {
      console.error('Unable to load cart count:', error)
    }
  }, [])
  const handleCartUpdated = useCallback((event) => {
    const { itemCount } = event.detail || {}
    if (Number.isInteger(itemCount) && itemCount >= 0) {
      cartCountRequest.current += 1
      setCurrentCartCount(itemCount)
      return
    }
    refreshCartCount()
  }, [refreshCartCount])
  const cartLabel = `Cart (${currentCartCount})`

  useEffect(() => {
    function syncSession() {
      setDemoUser(getDemoUser())
      refreshCartCount()
    }

    window.addEventListener('storage', syncSession)
    window.addEventListener('illam:auth-changed', syncSession)
    window.addEventListener('illam:cart-updated', handleCartUpdated)
    refreshCartCount()
    return () => {
      window.removeEventListener('storage', syncSession)
      window.removeEventListener('illam:auth-changed', syncSession)
      window.removeEventListener('illam:cart-updated', handleCartUpdated)
    }
  }, [handleCartUpdated, refreshCartCount])

  async function handleLogout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Unable to end the server session:', error)
    } finally {
      clearDemoUser()
      setDemoUser(null)
      window.location.assign('/login.html')
    }
  }

  return (
    <header className="site-header">
      <SiteBrand />

      <nav className="site-nav" aria-label="Main navigation">
        {navigationLinks.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
        <a href="/cart.html">{cartLabel}</a>
        {demoUser ? (
          <details className="site-account-menu">
            <summary>Account</summary>
            <div className="site-account-dropdown">
              <span className="site-account-email">{demoUser.user.email}</span>
              <a href="/account.html">My Account</a>
              <button type="button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </details>
        ) : (
          <a href="/login.html">Login</a>
        )}
      </nav>

      {showShopButton && (
        <a className="site-shop-button" href="/products.html">
          Shop Now
        </a>
      )}
    </header>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <a className="site-footer-brand" href="/">
        இல்லம்
      </a>
      <p>Bringing Tradition Into Every Home.</p>
      <span>© 2026 Illam. All Rights Reserved.</span>
    </footer>
  )
}

export { SiteBrand, SiteFooter, SiteHeader }
