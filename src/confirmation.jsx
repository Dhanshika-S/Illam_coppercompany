import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { SiteFooter, SiteHeader } from './components/SiteLayout.jsx'
import ProtectedApp from './components/ProtectedApp.jsx'
import { apiRequest } from './utils/api.js'
import { getDemoUser } from './utils/demoAuth.js'
import './commerce.css'

const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(value)

function ConfirmationPage() {
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const orderId = new URLSearchParams(window.location.search).get('id')

  useEffect(() => {
    if (!getDemoUser()) {
      window.location.replace('/login.html')
      return
    }
    if (!orderId) {
      setError('No order was specified.')
      return
    }

    apiRequest(`/orders/${encodeURIComponent(orderId)}`)
      .then(setOrder)
      .catch((requestError) => setError(requestError.message))
  }, [orderId])

  const invoiceUrl = order
    ? `/invoice.html?id=${encodeURIComponent(order.orderId)}`
    : '#'
  const downloadUrl = order
    ? `${invoiceUrl}&print=1`
    : '#'

  return (
    <div className="commerce-page">
      <SiteHeader />
      <main className="commerce-main">
        {error ? (
          <p className="commerce-alert" role="alert">{error}</p>
        ) : !order ? (
          <p role="status">Loading your order...</p>
        ) : (
          <section className="commerce-card confirmation-card">
            <p className="commerce-eyebrow">THANK YOU FOR CHOOSING ILLAM</p>
            <h1>Order Placed Successfully</h1>
            <p>Your order has been recorded. No online payment was processed.</p>
            <dl>
              <div><dt>Order ID</dt><dd>{order.orderId}</dd></div>
              <div><dt>Order Total</dt><dd>{money(order.total)}</dd></div>
              <div><dt>Status</dt><dd>{order.status}</dd></div>
            </dl>
            <div className="confirmation-actions">
              <a className="commerce-primary" href={invoiceUrl}>View Invoice</a>
              <a className="commerce-secondary" href={downloadUrl}>Download Invoice as PDF</a>
              <a className="commerce-secondary" href="/products.html">Continue Shopping</a>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode><ProtectedApp><ConfirmationPage /></ProtectedApp></StrictMode>,
)
