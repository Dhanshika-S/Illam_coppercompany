import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { SiteFooter, SiteHeader } from './components/SiteLayout.jsx'
import ProtectedApp from './components/ProtectedApp.jsx'
import { apiRequest } from './utils/api.js'
import { getDemoUser } from './utils/demoAuth.js'
import { resolveProductImage } from './utils/productImages.js'
import './commerce.css'

const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(value)

function InvoicePage() {
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const params = new URLSearchParams(window.location.search)
  const orderId = params.get('id')
  const shouldPrint = params.get('print') === '1'

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

  useEffect(() => {
    if (order && shouldPrint) {
      const timer = window.setTimeout(() => window.print(), 300)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [order, shouldPrint])

  return (
    <div className="commerce-page invoice-page">
      <SiteHeader />
      <main className="commerce-main invoice-main">
        {error ? (
          <p className="commerce-alert" role="alert">{error}</p>
        ) : !order ? (
          <p role="status">Loading invoice...</p>
        ) : (
          <>
            <div className="invoice-actions no-print">
              <button className="commerce-primary" type="button" onClick={() => window.print()}>
                Download Invoice as PDF
              </button>
              <button className="commerce-secondary" type="button" onClick={() => window.print()}>
                Print Invoice
              </button>
              <a className="commerce-secondary" href="/products.html">Continue Shopping</a>
              <a className="commerce-secondary" href="/account.html">View My Orders</a>
            </div>

            <article className="invoice-document">
              <header className="invoice-brand">
                <div>
                  <strong>இல்லம்</strong>
                  <span>TRADITIONAL LIVING</span>
                </div>
                <div className="invoice-title">
                  <h1>INVOICE</h1>
                  <p>{order.invoiceNumber}</p>
                </div>
              </header>

              <section className="invoice-meta">
                <div><span>Order ID</span><strong>{order.orderId}</strong></div>
                <div><span>Order Date</span><strong>{new Date(order.createdAt).toLocaleString('en-IN')}</strong></div>
                <div><span>Order Status</span><strong>{order.status}</strong></div>
              </section>

              <section className="invoice-address">
                <div>
                  <h2>Bill To</h2>
                  <strong>{order.customer.fullName}</strong>
                  <span>{order.customer.email}</span>
                  <span>{order.customer.phone}</span>
                </div>
                <div>
                  <h2>Delivery Address</h2>
                  <span>{order.customer.address}</span>
                  <span>{order.customer.city}, {order.customer.state}</span>
                  <span>PIN {order.customer.pinCode}</span>
                </div>
              </section>

              <div className="invoice-table-wrap">
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.product}>
                        <td>
                          <span className="invoice-product">
                            <img src={resolveProductImage(item.image)} alt="" />
                            {item.name}
                          </span>
                        </td>
                        <td>{item.quantity}</td>
                        <td>{money(item.unitPrice)}</td>
                        <td>{money(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <section className="invoice-totals">
                <p><span>Product Subtotal</span><strong>{money(order.subtotal)}</strong></p>
                <p><span>Shipping Charge</span><strong>{money(order.shippingCharge)}</strong></p>
                <p><span>Tax / GST</span><strong>{money(order.tax)}</strong></p>
                <p className="invoice-grand-total"><span>Grand Total</span><strong>{money(order.total)}</strong></p>
              </section>

              <footer className="invoice-note">
                <strong>Thank you for shopping with Illam.</strong>
                <span>This order was placed without online payment processing.</span>
              </footer>
            </article>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode><ProtectedApp><InvoicePage /></ProtectedApp></StrictMode>,
)
